/* Public settings for the live portal.
   Everything here is public by design. Never put a secret key here:
   no Supabase service_role / secret key, no Stripe sk_ or rk_ key,
   no webhook signing secret. Those live only in Supabase Edge Function secrets. */
window.SRED_CONFIG = {
  // Supabase: leave empty to run the sample-data demo only.
  supabaseUrl: "",
  supabaseKey: "",

  // Stripe Payment Links (https://buy.stripe.com/...), one per plan and period,
  // and the customer portal login link (https://billing.stripe.com/p/login/...).
  // Empty links show "Online billing is not switched on yet".
  stripe: {
    links: {
      starter_month: "", starter_year: "",
      growth_month: "",  growth_year: "",
      scale_month: "",   scale_year: ""
    },
    portal: ""
  }
};
