import { ApifyClient } from "apify-client";
import { NextResponse } from "next/server";

type ZillowPhoto = {
  url?: string;
  mixedSources?: {
    jpeg?: Array<{
      url?: string;
      width?: number;
    }>;
    webp?: Array<{
      url?: string;
      width?: number;
    }>;
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
  hiResImageLink?: string;
};

function extractImages(result: ZillowResult) {
  const discoveredImages = new Set<string>();

  for (const photo of result.responsivePhotos ?? []) {
    if (photo.url) {
      discoveredImages.add(photo.url);
    }
  }

  for (const photo of result.photos ?? []) {
    const jpegSources = photo.mixedSources?.jpeg ?? [];
    const webpSources = photo.mixedSources?.webp ?? [];

    const bestJpeg = [...jpegSources]
      .filter((source) => source.url)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];

    const bestWebp = [...webpSources]
      .filter((source) => source.url)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];

    if (bestJpeg?.url) {
      discoveredImages.add(bestJpeg.url);
    } else if (bestWebp?.url) {
      discoveredImages.add(bestWebp.url);
    } else if (photo.url) {
      discoveredImages.add(photo.url);
    }
  }

  if (result.hiResImageLink) {
    discoveredImages.add(result.hiResImageLink);
  }

  return Array.from(discoveredImages);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Incoming body:", body);
    const listingUrl = body.listingUrl;
console.log("listingUrl:", listingUrl);
    if (!listingUrl || typeof listingUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "A listing URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(listingUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid listing URL.",
        },
        {
          status: 400,
        }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only HTTP and HTTPS links are supported.",
        },
        {
          status: 400,
        }
      );
    }

    if (!parsedUrl.hostname.includes("zillow.com")) {
      return NextResponse.json(
        {
          success: false,
          message: "For this test, please use a Zillow property link.",
        },
        {
          status: 400,
        }
      );
    }

    const token = process.env.APIFY_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "The Apify API token is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const client = new ApifyClient({
      token,
    });

    const run = await client
      .actor("maxcopell/zillow-detail-scraper")
      .call({
        propertyStatus: "FOR_SALE",
        startUrls: [
          {
            url: parsedUrl.toString(),
          },
        ],
      });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({
        limit: 1,
      });

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Apify did not return any property information.",
        },
        {
          status: 502,
        }
      );
    }

    const property = items[0] as ZillowResult;
    const images = extractImages(property);

    const addressParts = [
      property.address?.streetAddress ?? property.streetAddress,
      property.address?.city ?? property.city,
      property.address?.state ?? property.state,
      property.address?.zipcode ?? property.zipcode,
    ].filter(Boolean);

    return NextResponse.json({
      success: true,
      jobId: crypto.randomUUID(),
      listingUrl: parsedUrl.toString(),
      pageTitle: addressParts.join(", ") || "Zillow property",
      imageCount: images.length,
      images,
      status: "photos-extracted",
      message: `Found ${images.length} Zillow property photos.`,
    });
  } catch (error) {
    console.error("Apify Zillow extraction error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Apify could not process that Zillow listing. Check the terminal for details.",
      },
      {
        status: 500,
      }
    );
  }
}