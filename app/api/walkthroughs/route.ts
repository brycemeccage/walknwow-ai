import { ApifyClient } from "apify-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type ImageSource = {
  url?: string;
  width?: number;
  height?: number;
};

type ZillowPhoto = {
  url?: string;
  mixedSources?: {
    jpeg?: ImageSource[];
    webp?: ImageSource[];
  };
};

type ZillowResult = {
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;

  responsivePhotos?: Array<{
    url?: string;
  }>;

  photos?: ZillowPhoto[];

  originalPhotos?: ZillowPhoto[];
  images?: ZillowPhoto[];

  hiResImageLink?: string;
};

const MAX_LISTING_PHOTOS = 200;

function normalizeZillowUrl(value: string): URL {
  const parsed = new URL(value.trim());

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "Only HTTP and HTTPS links are supported."
    );
  }

  const hostname =
    parsed.hostname
      .toLowerCase()
      .replace(/^www\./, "");

  if (
    hostname !== "zillow.com" &&
    !hostname.endsWith(".zillow.com")
  ) {
    throw new Error(
      "Please use a Zillow property link."
    );
  }

  /*
   * Keep only the actual property URL. Search-state and tracking
   * query parameters are not needed by the Apify detail scraper.
   */
  parsed.search = "";
  parsed.hash = "";

  return parsed;
}

function isHttpUrl(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^https?:\/\//i.test(
      value.trim()
    )
  );
}

function chooseBestPhotoUrl(
  photo: ZillowPhoto
): string {
  const jpeg =
    [...(photo.mixedSources?.jpeg ?? [])]
      .filter(
        (source) =>
          isHttpUrl(source.url)
      )
      .sort(
        (a, b) =>
          (b.width ?? 0) -
          (a.width ?? 0)
      )[0];

  if (jpeg?.url) {
    return jpeg.url.trim();
  }

  const webp =
    [...(photo.mixedSources?.webp ?? [])]
      .filter(
        (source) =>
          isHttpUrl(source.url)
      )
      .sort(
        (a, b) =>
          (b.width ?? 0) -
          (a.width ?? 0)
      )[0];

  if (webp?.url) {
    return webp.url.trim();
  }

  return isHttpUrl(photo.url)
    ? photo.url.trim()
    : "";
}

function addPhotoArray(
  photos: ZillowPhoto[] | undefined,
  discovered: Set<string>
): void {
  for (const photo of photos ?? []) {
    const url =
      chooseBestPhotoUrl(photo);

    if (url) {
      discovered.add(url);
    }

    if (
      discovered.size >=
      MAX_LISTING_PHOTOS
    ) {
      return;
    }
  }
}

function extractImages(
  result: ZillowResult
): string[] {
  const discovered =
    new Set<string>();

  /*
   * Prefer Zillow's canonical ordered responsive photo list.
   * This usually represents exactly the listing gallery.
   */
  for (
    const photo of
    result.responsivePhotos ?? []
  ) {
    if (isHttpUrl(photo.url)) {
      discovered.add(
        photo.url.trim()
      );
    }

    if (
      discovered.size >=
      MAX_LISTING_PHOTOS
    ) {
      break;
    }
  }

  /*
   * Then fill from known gallery-shaped photo arrays only.
   * DO NOT recursively crawl every URL in the property record:
   * that can collect thousands of thumbnails, maps, avatars,
   * nearby listings, and duplicate image variants.
   */
  addPhotoArray(
    result.photos,
    discovered
  );

  addPhotoArray(
    result.originalPhotos,
    discovered
  );

  addPhotoArray(
    result.images,
    discovered
  );

  if (
    discovered.size === 0 &&
    isHttpUrl(
      result.hiResImageLink
    )
  ) {
    discovered.add(
      result.hiResImageLink.trim()
    );
  }

  return Array.from(
    discovered
  ).slice(
    0,
    MAX_LISTING_PHOTOS
  );
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const listingUrl =
      typeof body.listingUrl ===
        "string"
        ? body.listingUrl.trim()
        : "";

    if (!listingUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A listing URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl =
        normalizeZillowUrl(
          listingUrl
        );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Please enter a valid Zillow listing URL.",
        },
        {
          status: 400,
        }
      );
    }

    const token =
      process.env.APIFY_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Apify API token is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const client =
      new ApifyClient({
        token,
      });

    console.log(
      "Starting Zillow extraction:",
      parsedUrl.toString()
    );

    const run =
      await client
        .actor(
          "maxcopell/zillow-detail-scraper"
        )
        .call({
          propertyStatus:
            "FOR_SALE",
          startUrls: [
            {
              url:
                parsedUrl.toString(),
            },
          ],
        });

    const { items } =
      await client
        .dataset(
          run.defaultDatasetId
        )
        .listItems({
          limit: 5,
        });

    if (
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Apify did not return any property information.",
        },
        {
          status: 502,
        }
      );
    }

    const property =
      items[0] as ZillowResult;

    const images =
      extractImages(
        property
      );

    if (
      images.length === 0
    ) {
      console.error(
        "Apify returned a property but no listing-gallery images.",
        {
          datasetId:
            run.defaultDatasetId,
          availableKeys:
            Object.keys(
              property
            ),
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "The property was found, but no listing-gallery photos were extracted.",
        },
        {
          status: 502,
        }
      );
    }

    const addressParts = [
      property.address
        ?.streetAddress ??
        property.streetAddress,
      property.address?.city ??
        property.city,
      property.address?.state ??
        property.state,
      property.address?.zipcode ??
        property.zipcode,
    ].filter(Boolean);

    console.log(
      `Extracted ${images.length} listing-gallery photos.`
    );

    return NextResponse.json({
      success: true,
      jobId:
        crypto.randomUUID(),
      listingUrl:
        parsedUrl.toString(),
      pageTitle:
        addressParts.join(", ") ||
        "Zillow property",
      imageCount:
        images.length,
      images,
      status:
        "photos-extracted",
      message:
        `Found ${images.length} Zillow property photos.`,
    });
  } catch (error) {
    console.error(
      "Apify Zillow extraction error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Apify could not process that Zillow listing: ${error.message}`
            : "Apify could not process that Zillow listing.",
      },
      {
        status: 500,
      }
    );
  }
}