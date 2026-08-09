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
  responsivePhotos?: Array<{ url?: string }>;
  photos?: ZillowPhoto[];
  originalPhotos?: ZillowPhoto[];
  images?: ZillowPhoto[];
  hiResImageLink?: string;
};

const MAX_LISTING_PHOTOS = 200;

function isHttpUrl(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^https?:\/\//i.test(value.trim())
  );
}

function normalizeListingUrl(
  value: string
): URL {
  const parsed =
    new URL(value.trim());

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "Only HTTP and HTTPS links are supported."
    );
  }

  parsed.search = "";
  parsed.hash = "";

  return parsed;
}

function normalizedHost(
  url: URL
): string {
  return url.hostname
    .toLowerCase()
    .replace(/^www\./, "");
}

function isZillowHost(
  host: string
): boolean {
  return (
    host === "zillow.com" ||
    host.endsWith(".zillow.com")
  );
}

function isWeichertHost(
  host: string
): boolean {
  return (
    host === "weichert.com" ||
    host.endsWith(".weichert.com")
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
  for (
    const photo of
    photos ?? []
  ) {
    const url =
      chooseBestPhotoUrl(
        photo
      );

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

function extractZillowImages(
  result: ZillowResult
): string[] {
  const discovered =
    new Set<string>();

  /*
   * responsivePhotos is the canonical Zillow gallery when available.
   * Do not merge alternate arrays into it because that can duplicate
   * the entire gallery at different resolutions.
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

  if (
    discovered.size === 0
  ) {
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
  }

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

function decodeHtml(
  value: string
): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&#47;", "/")
    .replaceAll("\\/", "/")
    .replaceAll("\\u002F", "/");
}

function photoSequence(
  url: string
): number {
  const match =
    url.match(
      /-(\d+)\.(?:jpe?g|png|webp)(?:$|\?)/i
    );

  return match
    ? Number(match[1])
    : Number.MAX_SAFE_INTEGER;
}

function extractWeichertImages(
  html: string
): string[] {
  const decoded =
    decodeHtml(html);

  const discovered =
    new Set<string>();

  /*
   * Weichert listing galleries currently use URLs like:
   * https://d36xftgacqn2p.cloudfront.net/listingphotos38/4045538-1.jpg
   *
   * We intentionally scope to "listingphotos" paths so logos, ads,
   * nearby listings, agent photos, and other page imagery are ignored.
   */
  const absoluteMatches =
    decoded.match(
      /https?:\/\/[^"'<> \n\r\t]+\/listingphotos\d*\/[^"'<> \n\r\t]+?\.(?:jpe?g|png|webp)(?:\?[^"'<> \n\r\t]*)?/gi
    ) ?? [];

  for (
    const value of
    absoluteMatches
  ) {
    try {
      const url =
        new URL(value);

      if (
        url.pathname
          .toLowerCase()
          .includes(
            "/listingphotos"
          )
      ) {
        url.search = "";
        url.hash = "";

        discovered.add(
          url.toString()
        );
      }
    } catch {
      // Ignore malformed image candidates.
    }
  }

  /*
   * Fallback for relative listing-photo URLs.
   */
  const relativeMatches =
    decoded.match(
      /["'(=]\s*(\/[^"'<> \n\r\t]*listingphotos\d*\/[^"'<> \n\r\t]+?\.(?:jpe?g|png|webp))/gi
    ) ?? [];

  for (
    const match of
    relativeMatches
  ) {
    const relative =
      match
        .replace(
          /^["'(=]\s*/,
          ""
        )
        .trim();

    try {
      const absolute =
        new URL(
          relative,
          "https://www.weichert.com"
        );

      discovered.add(
        absolute.toString()
      );
    } catch {
      // Ignore malformed relative candidates.
    }
  }

  return Array.from(
    discovered
  )
    .sort(
      (a, b) =>
        photoSequence(a) -
        photoSequence(b)
    )
    .slice(
      0,
      MAX_LISTING_PHOTOS
    );
}

function extractWeichertTitle(
  html: string
): string {
  const decoded =
    decodeHtml(html);

  const ogTitle =
    decoded.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    )?.[1] ??
    decoded.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
    )?.[1];

  if (ogTitle) {
    return ogTitle
      .replace(/\s*\|\s*Weichert.*$/i, "")
      .trim();
  }

  const title =
    decoded.match(
      /<title[^>]*>([^<]+)<\/title>/i
    )?.[1];

  return (
    title
      ?.replace(/\s*\|\s*Weichert.*$/i, "")
      .trim() ||
    "Weichert property"
  );
}

async function extractFromWeichert(
  parsedUrl: URL
): Promise<{
  images: string[];
  pageTitle: string;
}> {
  const response =
    await fetch(
      parsedUrl.toString(),
      {
        redirect: "follow",
        cache: "no-store",
        signal:
          AbortSignal.timeout(
            60000
          ),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml",
          "Accept-Language":
            "en-US,en;q=0.9",
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `Weichert returned status ${response.status}.`
    );
  }

  const html =
    await response.text();

  const images =
    extractWeichertImages(
      html
    );

  if (
    images.length === 0
  ) {
    throw new Error(
      "The Weichert property page loaded, but no listing-gallery photos were found."
    );
  }

  return {
    images,
    pageTitle:
      extractWeichertTitle(
        html
      ),
  };
}

async function extractFromZillow(
  parsedUrl: URL
): Promise<{
  images: string[];
  pageTitle: string;
}> {
  const token =
    process.env
      .APIFY_API_TOKEN;

  if (!token) {
    throw new Error(
      "The Apify API token is missing."
    );
  }

  const client =
    new ApifyClient({
      token,
    });

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
    throw new Error(
      "Apify did not return any property information."
    );
  }

  const property =
    items[0] as ZillowResult;

  const images =
    extractZillowImages(
      property
    );

  if (
    images.length === 0
  ) {
    throw new Error(
      "The Zillow property was found, but no listing-gallery photos were extracted."
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

  return {
    images,
    pageTitle:
      addressParts.join(", ") ||
      "Zillow property",
  };
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
        normalizeListingUrl(
          listingUrl
        );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid listing URL.",
        },
        {
          status: 400,
        }
      );
    }

    const host =
      normalizedHost(
        parsedUrl
      );

    let source:
      | "zillow"
      | "weichert";

    let extraction: {
      images: string[];
      pageTitle: string;
    };

    if (
      isZillowHost(host)
    ) {
      source = "zillow";

      console.log(
        "Starting Zillow extraction:",
        parsedUrl.toString()
      );

      extraction =
        await extractFromZillow(
          parsedUrl
        );
    } else if (
      isWeichertHost(host)
    ) {
      source = "weichert";

      console.log(
        "Starting Weichert extraction:",
        parsedUrl.toString()
      );

      extraction =
        await extractFromWeichert(
          parsedUrl
        );
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supported listing sites are Zillow and Weichert.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      `Extracted ${extraction.images.length} ${source} listing photos.`
    );

    return NextResponse.json({
      success: true,
      jobId:
        crypto.randomUUID(),
      listingUrl:
        parsedUrl.toString(),
      source,
      pageTitle:
        extraction.pageTitle,
      imageCount:
        extraction.images.length,
      images:
        extraction.images,
      status:
        "photos-extracted",
      message:
        `Found ${extraction.images.length} ${source === "zillow" ? "Zillow" : "Weichert"} property photos.`,
    });
  } catch (error) {
    console.error(
      "Listing extraction error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "The listing could not be processed.",
      },
      {
        status: 500,
      }
    );
  }
}