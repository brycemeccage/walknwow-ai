import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signature configuration is missing." },
      { status: 400 }
    );
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const projectId = session.metadata?.project_id || session.client_reference_id;
      const userId = session.metadata?.user_id;

      if (!projectId || !userId) {
        throw new Error("Checkout session is missing project/user metadata.");
      }

      const supabase = adminSupabase();

      const { error: paymentError } = await supabase
        .from("project_payments")
        .upsert(
          {
            project_id: projectId,
            user_id: userId,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            amount_total: session.amount_total || 0,
            currency: session.currency || "usd",
            payment_status: session.payment_status || "paid",
            package_name: session.metadata?.package || null,
            addons: session.metadata?.addons || "",
            paid_at: new Date().toISOString(),
          },
          { onConflict: "stripe_checkout_session_id" }
        );

      if (paymentError) throw paymentError;

      const { error: projectError } = await supabase
        .from("projects")
        .update({
          package_name: session.metadata?.package || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("user_id", userId);

      if (projectError) throw projectError;

      console.log(`Payment recorded for project ${projectId}: ${session.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}
