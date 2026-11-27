// Supabase Edge Function: stripe-webhook
// Stripe calls this after checkout and whenever a subscription changes.
// It checks Stripe's signature, then updates public.billing for that company.
//
// Secrets (set them in Supabase > Edge Functions > Secrets, never in code or chat):
//   STRIPE_SECRET_KEY      a Stripe restricted key with read access to Subscriptions,
//                          Prices, Products, Customers and Checkout Sessions
//   STRIPE_WEBHOOK_SECRET  the signing secret of the webhook endpoint (whsec_...)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
//
// Which plan a payment buys comes from the Stripe price's lookup key:
//   starter_month, starter_year, growth_month, growth_year, scale_month, scale_year
// Turn OFF "Verify JWT" for this function: Stripe signs its requests instead.

import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});
const crypto = Stripe.createSubtleCryptoProvider();
const db = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const PLANS = ["starter", "growth", "scale", "partner"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function planOf(sub: Stripe.Subscription) {
  const price = sub.items.data[0]?.price;
  const key = (price?.lookup_key ?? "").toLowerCase();
  const plan = PLANS.find((p) => key.startsWith(p)) ?? null;
  const period = price?.recurring?.interval === "year" ? "year" : "month";
  return { plan, period };
}

function iso(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function saveSubscription(sub: Stripe.Subscription, orgId?: string | null) {
  const { plan, period } = planOf(sub);
  const row: Record<string, unknown> = {
    status: sub.status,
    period,
    current_period_end: iso(sub.items.data[0]?.current_period_end ?? (sub as any).current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    trial_ends_at: iso(sub.trial_end),
    updated_at: new Date().toISOString(),
  };
  if (plan) row.plan = plan;
  else console.warn(`Price on ${sub.id} has no lookup key matching a plan; plan left unchanged.`);

  const query = orgId
    ? db.from("billing").upsert({ org_id: orgId, ...row }, { onConflict: "org_id" })
    : db.from("billing").update(row).eq("stripe_subscription_id", sub.id);
  const { error } = await query;
  if (error) throw new Error(`Saving billing failed: ${error.message}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(), signature, Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "", undefined, crypto,
    );
  } catch (err) {
    console.error("Bad signature:", (err as Error).message);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        if (!orgId || !UUID.test(orgId)) {
          console.warn(`Checkout ${session.id} has no company id; was the link opened from the portal?`);
          break;
        }
        if (session.mode !== "subscription" || !session.subscription) break;
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await saveSubscription(sub, orgId);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        // Only updates companies already linked by checkout above.
        await saveSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(event.type, (err as Error).message);
    return new Response("Handler error", { status: 500 }); // Stripe retries
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
