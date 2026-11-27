/* Supabase connection for the live portal.
   Both values are public by design: security comes from the row-level rules
   in supabase/schema.sql. Never put the service_role / secret key here.
   Leave them empty to run the sample-data demo only. */
window.SRED_CONFIG = {
  supabaseUrl: "",
  supabaseKey: ""
};
