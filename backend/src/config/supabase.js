const { createClient } = require("@supabase/supabase-js");
const { PostgrestClient } = require("@supabase/postgrest-js");

// Docker: POSTGREST_URL points at the local PostgREST container (same .from() query API as Supabase).
// Otherwise: hosted Supabase with the server-only SUPABASE_SECRET_KEY (bypasses RLS).
const supabase = process.env.POSTGREST_URL
  ? new PostgrestClient(process.env.POSTGREST_URL)
  : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

module.exports = supabase;
