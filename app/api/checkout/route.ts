import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PACKAGE_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  signature: process.env.STRIPE_PRICE_SIGNATURE,
  estate: process.env.STRIPE_PRICE_ESTATE,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

const ADDON_PRICE_IDS: Record<string, string | undefined> = {
  "4k": process.env.STRIPE_PRICE_4K,
  voiceover: process.env.STRIPE_PRICE_VOICEOVER,
  agent_card: process.env.STRIPE_PRICE_AGENT_CARD,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const projectId = String(body.projectId || "");
    const packageKey = String(body.package || "").toLowerCase();
    const addons = Array.isArray(body.addons)
      ? body.addons.map((value: unknown) => String(value).toLowerCase())
      : [];

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID." },
        { status: 400 }
      );
    }

    const packagePriceId = PACKAGE_PRICE_IDS[packageKey];

    if (!packagePriceId) {
      return NextResponse.json(
        { error: "Invalid package selection." },
        { status: 400 }
      );
    }

    // Make sure the project belongs to the signed-in user.
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: packagePriceId,
        quantity: 1,
      },
    ];

    for (const addon of addons) {
      const priceId = ADDON_PRICE_IDS[addon];
      if (priceId) {
        lineItems.push({
          price: priceId,
          quantity: 1,
        });
      }
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/projects/${projectId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/projects/${projectId}?checkout=cancelled`,
      customer_email: user.email || undefined,
      client_reference_id: projectId,
      metadata: {
        project_id: projectId,
        user_id: user.id,
        package: packageKey,
        addons: addons.join(","),
      },
      payment_intent_data: {
        metadata: {
          project_id: projectId,
          user_id: user.id,
        },
      },
      allow_promotion_codes: false,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 }
    );
  }
}
