import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — real-time updates will not work."
  );
}

/**
 * Frontend Supabase client — anon key only, never the service-role key
 * (PROJECT_SPEC.md §14, AI-RULES.md §5.2).
 *
 * Used ONLY for real-time change notifications (Option 2, agreed with
 * the team): subscriptions tell us *that* a delivery changed, never
 * *what* changed. Actual delivery data always comes from our
 * authenticated Express API (apiFetch), never read directly from a
 * real-time payload. This avoids depending on Supabase RLS policies
 * for access control, consistent with our locked architecture decision
 * that the Express backend is the sole authorization authority.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);