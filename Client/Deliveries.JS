/**
 * Deliveries API client.
 *
 * ============================================================
 * ASSUMED CONTRACT — NOT YET CONFIRMED BY DEV 2.
 *
 * PROJECT_SPEC.md §10.2 defines GET /api/deliveries as
 * "Retrieve deliveries relevant to the authenticated
 * user/role" but does not define the exact response shape
 * (README.md explicitly warns not to assume payload format).
 *
 * This client assumes:
 *   GET /api/deliveries  ->  200 OK
 *   { "deliveries": [
 *       {
 *         "id": "...",
 *         "tracking_code": "...",
 *         "customer_name": "...",
 *         "customer_phone": "...",
 *         "address": "...",
 *         "item_description": "...",
 *         "status": "PENDING" | "ASSIGNED" | "PICKED_UP" |
 *                   "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED",
 *         "assigned_rider_id": "...",
 *         "created_at": "...",
 *         "updated_at": "..."
 *       }
 *   ]}
 *
 * IMPORTANT SECURITY NOTE (AI-RULES.md §5.4, §6.2):
 * This function does NOT filter deliveries by rider on the
 * client. Role-based scoping ("Rider only sees their own
 * assigned deliveries") is the backend's responsibility
 * (D2-9). The frontend must render exactly what the backend
 * returns and must never re-implement that authorization
 * decision locally.
 * ============================================================
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function getMyDeliveries(accessToken) {
  const response = await fetch(`${API_BASE_URL}/api/deliveries`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let message = `Failed to load deliveries (status ${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Response body wasn't JSON — keep the generic message.
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data.deliveries ?? [];
}