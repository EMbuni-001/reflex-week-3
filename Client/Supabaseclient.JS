/**
 * TEMP STUB — NOT FINAL.
 *
 * Env var naming was never locked in Phase 0. This assumes
 * Vite-style `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`,
 * which is a reasonable default for a Vite project but has
 * not been confirmed by the team. Confirm with Dev 2 before
 * relying on these exact names in a real .env file.
 *
 * No secrets are hardcoded here — this only reads from env
 * vars, per AI-RULES.md §5.1.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);