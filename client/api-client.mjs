/**
 * Node-runnable copy of src/lib/api.js's apiFetch, for the D1.11
 * consistency pass. Plain Node scripts can't import the real file
 * directly - it uses `import.meta.env.VITE_API_BASE_URL`, a Vite-only
 * syntax that throws in plain Node (import.meta.env is undefined
 * outside a Vite build). The only difference here is how the base URL
 * is read (process.env instead of import.meta.env); the request logic
 * itself is identical to the real file - see verify-sync.mjs, which
 * proves that programmatically rather than just asserting it in this
 * comment.
 */
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4400";

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
