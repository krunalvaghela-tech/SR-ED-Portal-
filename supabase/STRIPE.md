# Stripe setup for memberships (about 30 minutes)

Companies pay through Stripe's own secure checkout. The portal never sees a card
number. After a payment, Stripe tells a small Supabase function, which updates the
company's plan in the database.

```
Portal "Choose plan"  ->  Stripe Payment Link (checkout)  ->  back to the portal
                                     |
                                     v
                Stripe webhook  ->  Supabase function "stripe-webhook"  ->  billing table
```

Do the Supabase setup (`SETUP.md`) first. Do all of this in Stripe's **test mode**
first, then repeat it in live mode. Test mode and live mode have separate products,
links, keys and webhooks.

## 1. Create the Stripe account
1. Sign up at https://stripe.com with the KV WebDesign business email. Country: **Canada**.
2. Keep the **Test mode** switch on (top right) for now.
3. Later, before going live, finish **Activate payments** (business details and bank account).

## 2. Create the plans
**Product catalogue > Add product.** Make three products, each with two recurring prices in **CAD**:

| Product | Monthly price | Yearly price | Lookup keys |
|---|---|---|---|
| SR&ED Portal Starter | $79 / month | $790 / year | `starter_month`, `starter_year` |
| SR&ED Portal Growth | $199 / month | $1,990 / year | `growth_month`, `growth_year` |
| SR&ED Portal Scale | $449 / month | $4,490 / year | `scale_month`, `scale_year` |

For each price, open **More pricing options** and set the **Lookup key** exactly as
shown above. The webhook uses it to know which plan was bought.

Prices are plus tax. To charge GST/HST automatically, turn on **Stripe Tax**
(Settings > Tax) and register for Canada.

## 3. Create six Payment Links
For each price: open it, choose **Create payment link**, then:
- **After payment:** choose *Don't show confirmation page* and redirect to
  `https://krunalvaghela-tech.github.io/SR-ED-Portal-/?paid=1#plans`
- Turn on **Collect customers' addresses** if you use Stripe Tax.
- Leave the free trial off. The portal already gives every company 14 days free.

Copy each link (`https://buy.stripe.com/...`).

## 4. Turn on the customer portal
**Settings > Billing > Customer portal:**
- Allow customers to update payment methods, see invoices, cancel, and switch
  between the three products.
- Under **Business information**, add the link `https://krunalvaghela-tech.github.io/SR-ED-Portal-/`.
- Copy the **customer portal login link** (`https://billing.stripe.com/p/login/...`).

## 5. Create the database table
In Supabase **SQL Editor**, paste all of `supabase/billing.sql` and click **Run**.

## 6. Deploy the webhook function
1. Supabase > **Edge Functions** > **Deploy a new function** > **Via Editor**.
2. Name it `stripe-webhook`, paste all of `supabase/functions/stripe-webhook/index.ts`, click **Deploy**.
3. Open the function's **Details** and turn **off** "Verify JWT" (also called "Enforce JWT verification"). Stripe proves itself with a signature instead.
4. Copy the function URL: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`.

## 7. Connect Stripe to the function
1. Stripe > **Developers > API keys > Create restricted key**. Name it `sred-portal-webhook`
   and give **Read** access to: Checkout Sessions, Customers, Prices, Products, Subscriptions.
   Everything else: None.
2. Stripe > **Developers > Webhooks > Add destination** (or Add endpoint):
   - Endpoint URL: the function URL from step 6.
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `customer.subscription.paused`, `customer.subscription.resumed`.
   - Copy the **Signing secret** (`whsec_...`).
3. Supabase > **Edge Functions > Secrets**, add:
   - `STRIPE_SECRET_KEY` = the restricted key (`rk_...`)
   - `STRIPE_WEBHOOK_SECRET` = the signing secret (`whsec_...`)

**Never paste these two values into chat, email, GitHub or `config.js`.** They only
go in Supabase secrets.

## 8. Send Claude the public links
These are safe to share, because anyone can open a checkout page:
- The six Payment Links, labelled `starter_month`, `starter_year`, `growth_month`, `growth_year`, `scale_month`, `scale_year`
- The customer portal login link

Claude puts them in `config.js` and pushes the update.

## 9. Test it
1. Sign in to the portal as a company admin and open **Membership**.
2. Choose a plan. On Stripe's page, pay with test card `4242 4242 4242 4242`, any future date, any CVC.
3. You come back to the portal with a thank-you note. Within a minute the plan shows **Active**.
4. If it doesn't, check Stripe > Webhooks > your endpoint > recent deliveries, and Supabase > Edge Functions > stripe-webhook > Logs.

## 10. Go live
Turn off test mode in Stripe and repeat steps 2, 3, 4 and 7 with live values:
live products, live Payment Links, a live restricted key and a live webhook. Replace
both Supabase secrets with the live ones, and send Claude the live links.

## Who can do what
- Only a **company admin** (or KV admin) sees the plan and can pay or manage billing.
- Nobody can change a plan from the browser. The `billing` table has no write rules,
  so only the webhook function can update it, and only after Stripe confirms a payment.
