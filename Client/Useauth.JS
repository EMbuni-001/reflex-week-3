/**
 * useAuth
 *
 * ============================================================
 * TEMP STUB — NOT FINAL. Owned long-term by Dev 1 (frontend
 * auth/login, D1-3/D1-4) and Dev 2 (backend auth, D2-4/D2-5).
 *
 * This exists only so Developer 3 can build and test the Rider
 * workstream in isolation while Dev 1/Dev 2's real auth flow
 * does not exist yet. Delete/replace this file entirely once
 * Dev 1's real auth context lands — do not merge with it.
 * ============================================================
 *
 * Reflex uses Supabase Auth with JWT access tokens (locked
 * Phase 0 decision). This stub assumes a `profiles` table
 * (or equivalent) holds `role` for the logged-in user, since
 * role must never be trusted from the frontend alone
 * (PROJECT_SPEC.md §14, AI-RULES.md §5.4) — the backend is
 * still the real authorization authority. This hook only
 * supplies enough identity info for the Rider UI to know
 * "who am I" and to attach a Bearer token to API calls.
 */

import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export function useAuth() {
  const [state, setState] = useState({
    user: null,
    profile: null,
    accessToken: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          if (isMounted) {
            setState({
              user: null,
              profile: null,
              accessToken: null,
              loading: false,
              error: null,
            });
          }
          return;
        }

        // Role/profile lookup — table name/shape is an
        // implementation detail pending Dev 2 confirmation.
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, role")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;

        if (isMounted) {
          setState({
            user: session.user,
            profile,
            accessToken: session.access_token,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            user: null,
            profile: null,
            accessToken: null,
            loading: false,
            error: err,
          });
        }
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return state;
}