const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

/**
 * apiFetch — shared API client helper (Task D1.6)
 * ---------------------------------------------------------------------
 * A small wrapper around fetch() so future tasks (D1.7 dashboard,
 * D1.8 delivery creation, D1.9 delivery detail) don't each duplicate
 * base-URL handling, JSON parsing, auth-header attachment, and error
 * shaping. Not a new architectural layer — just avoiding copy-pasted
 * fetch boilerplate per AI-RULES.md §17.4 ("avoid duplicate logic").
 *
 * ASSUMED error-response shape (F0.2 API contract doc not available):
 *   { "error": "human-readable message" }
 * This is an explicit, flagged assumption — if Developer 2's actual
 * error shape differs, only the `catch`/error-parsing logic below
 * needs to change, not every call site.
 *
 * Added in D1.10: genuine network failures (server unreachable, no
 * response at all) are now caught separately from server-returned
 * error responses, so callers always get a clear, consistent message
 * instead of a raw browser-level error like "Failed to fetch".
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
    const message = data?.error ?? "Request failed. Please try again.";
    throw new Error(message);
  }

  return data;
}
