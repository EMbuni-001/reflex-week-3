const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const STORAGE_KEY = "reflex_auth";

/**
 * apiFetch — shared API client helper (Task D1.6, extended Task 11)
 * ---------------------------------------------------------------------
 * ASSUMED error-response shape: { "error": "human-readable message" }
 *
 * Task 11 addition — session-expiry handling:
 * If a request that carries a token gets back a 401, that almost always
 * means the token expired or was invalidated server-side (not that the
 * user typed a wrong password — that only happens on the login call
 * itself, which never sends a token). In that case we:
 *   1. Clear the stored session (same localStorage key AuthContext
 *      uses — duplicated here deliberately, since apiFetch is a plain
 *      function and can't call useAuth()/AuthContext directly).
 *   2. Throw a clear, specific message instead of a generic one, so
 *      the user understands *why* their request failed.
 * We do not force a redirect here (apiFetch has no router access) —
 * ProtectedRoute already redirects to /login the next time a guarded
 * page reads isAuthenticated=false, which happens automatically once
 * the stored session is cleared.
 *
 * @param {string} path - API path, e.g. "/api/auth/login"
 * @param {object} [options] - fetch options (method, body, etc.)
 * @param {string|null} [token] - JWT to attach as a Bearer token, if any
 */
export async function apiFetch(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    // fetch() itself threw — no response was ever received (server down,
    // no connectivity, CORS misconfiguration, etc.), not a server error.
    throw new Error("Network error. Please check your connection and try again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // A 401 on a request that carried a token means the session is no
    // longer valid (expired/revoked) — distinct from a login attempt's
    // own 401 (wrong password), since login calls never pass a token.
    if (response.status === 401 && token) {
      localStorage.removeItem(STORAGE_KEY);
      throw new Error("Your session has expired. Please sign in again.");
    }

    const message = data?.error ?? "Request failed. Please try again.";
    throw new Error(message);
  }

  return data;
}