import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

/**
 * AuthContext — Task D1.6 (replaces the D1.2 placeholder)
 * ---------------------------------------------------------------------
 * Calls our own backend's POST /api/auth/login (already in the locked
 * API surface, PROJECT_SPEC.md §10.1) rather than talking to Supabase
 * directly from the frontend. See the D1.6 planning discussion for why:
 * the architecture diagram (§8) shows Frontend -> Express API -> DB
 * with no direct Frontend->Supabase arrow, and no Supabase client
 * library is listed among the frontend's recommended technologies
 * (§9.1). The Express backend is responsible for verifying credentials
 * against Supabase Auth and returning a JWT + profile in one response.
 *
 * ASSUMED request/response shape for POST /api/auth/login (F0.2 API
 * contract doc not available — explicit, flagged assumption):
 *   Request:  { email, password }
 *   Response: { token, user: { id, name, email, role } }
 * If Developer 2's actual endpoint differs, only the two spots marked
 * below need to change — not this file's exported shape.
 *
 * `useAuth()` still returns everything it did in D1.2 (user,
 * isAuthenticated, login, logout) so ProtectedRoute, Navbar, and every
 * existing page needs no changes. Two fields are ADDED, not removed or
 * renamed: `token` (needed once other tasks call authenticated
 * endpoints) and `isInitializing` (see ProtectedRoute.jsx — needed so a
 * page refresh doesn't briefly redirect to /login before the stored
 * session loads from localStorage).
 *
 * TOKEN STORAGE: localStorage, for MVP simplicity. This is a real
 * trade-off (XSS risk vs. an httpOnly cookie, which would need backend
 * cookie-handling work not yet scoped) — flagged here for the team's
 * required "Engineering Trade-Offs" documentation (PROJECT_SPEC.md §25),
 * not a silent default.
 */
const AuthContext = createContext(null);
export { AuthContext };

const STORAGE_KEY = "reflex_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On mount, restore a previous session from localStorage so a page
  // refresh doesn't silently log the user out.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsInitializing(false);
  }, []);

  const login = async (email, password) => {
    // <-- change this call if Developer 2's request shape differs
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { access_token: newToken, user: newUser } = data;

    setUser(newUser);
    setToken(newToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser, token: newToken }));

    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    token,
    isAuthenticated: user !== null,
    isInitializing,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
