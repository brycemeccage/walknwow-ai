import { ApifyClient } from "apify-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type ZillowPhoto = {
  url?: string;
  mixedSources?: {
    jpeg?: Array<{ url?: string; width?: number }>;
    webp?: Array<{ url?: string; width?: number }>;
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
  hiResImageLink?: string;
  [key: string]: unknown;
};

function normalizeZillowUrl(value: string): URL {
  const parsed = new URL(value.trim());

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS links are supported.");
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

  if (host !== "zillow.com" && !host.endsWith(".zillow.com")) {
    throw new Error("Please use a Zillow property link.");
  }

  parsed.search = "";
  parsed.hash = "";
  return parsed;
}

function looksLikeImageUrl(value: string): boolean {
  const cleaned = value.trim();
  if (!/^https?:\/\//i.test(cleaned)) return false;

  const lower = cleaned.toLowerCase();

  return (
    /\.(jpe?g|png|webp)(?:$|\?)/i.test(cleaned) ||
    lower.includes("zillowstatic.com")
  );
}

function collectImageUrls(
  value: unknown,
  discovered: Set<string>,
  depth = 0
): void {
  if (depth > 8 || value == null) return;

  if (typeof value === "string") {
    if (looksLikeImageUrl(value)) discovered.add(value.trim());
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectImageUrls(item, discovered, depth + 1);
    }
    return;
  }

  if (typeof value !== "object") return;

  for (const child of Object.values(value as Record<string, unknown>)) {
    collectImageUrls(child, discovered, depth + 1);
  }
}

function extractImages(result: ZillowResult): string[] {
  const discovered = new Set<string>();

  for (const photo of result.responsivePhotos ?? []) {
    if (photo.url && looksLikeImageUrl(photo.url)) {
      discovered.add(photo.url);
    }
  }

  for (const photo of result.photos ?? []) {
    const jpeg = [...(photo.mixedSources?.jpeg ?? [])]
      .filter((source) => source.url && looksLikeImageUrl(source.url))
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];

    const webp = [...(photo.mixedSources?.webp ?? [])]
      .filter((source) => source.url && looksLikeImageUrl(source.url))
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];

    if (jpeg?.url) discovered.add(jpeg.url);
    else if (webp?.url) discovered.add(webp.url);
    else if (photo.url && looksLikeImageUrl(photo.url)) discovered.add(photo.url);
  }

  if (result.hiResImageLink && looksLikeImageUrl(result.hiResImageLink)) {
    discovered.add(result.hiResImageLink);
  }

  collectImageUrls(result, discovered);
  return Array.from(discovered);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const listingUrl =
      typeof body.listingUrl === "string" ? body.listingUrl.trim() : "";

    if (!listingUrl) {
      return NextResponse.json(
        { success: false, message: "A listing URL is required." },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = normalizeZillowUrl(listingUrl);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Please enter a valid Zillow listing URL.",
        },
        { status: 400 }
      );
    }

    const token = process.env.APIFY_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "The Apify API token is missing." },
        { status: 500 }
      );
    }

    const client = new ApifyClient({ token });

    const run = await client
      .actor("maxcopell/zillow-detail-scraper")
      .call({
        propertyStatus: "FOR_SALE",
        startUrls: [{ url: parsedUrl.toString() }],
      });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit: 5 });

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Apify did not return any property information.",
        },
        { status: 502 }
      );
    }

    const property = items[0] as ZillowResult;
    const images = extractImages(property);

    if (images.length === 0) {
      console.error("Apify returned a property but no images.", {
        datasetId: run.defaultDatasetId,
        keys: Object.keys(property),
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "The property was found, but no usable listing photos were extracted.",
        },
        { status: 502 }
      );
    }

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
          error instanceof Error
            ? `Apify could not process that Zillow listing: ${error.message}`
            : "Apify could not process that Zillow listing.",
      },
      { status: 500 }
    );
  }
}