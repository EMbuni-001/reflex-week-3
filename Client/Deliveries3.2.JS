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
 *
 * ------------------------------------------------------------
 * ADDED FOR D3-2 — ALSO ASSUMED, ALSO UNCONFIRMED:
 *
 *   GET /api/deliveries/:id  ->  200 OK
 *   { "delivery": { ...same shape as one item above... } }
 *
 *   PATCH /api/deliveries/:id/status
 *   body: { "status": "PICKED_UP" }   (the requested new status)
 *   -> 200 OK
 *      { "delivery": { ...updated delivery... } }
 *   -> 409/422 (or similar) on an invalid transition:
 *      { "error": "human readable reason" }
 *
 * PROJECT_SPEC.md §10.2 only says this endpoint's purpose is
 * "Request a delivery status transition" — the request body
 * field name, the success shape, and the error status
 * code/shape are NOT defined anywhere and must be confirmed
 * with Dev 2 (owner of D2-12) before this is treated as final.
 *
 * CRITICAL: updateDeliveryStatus() below performs NO
 * client-side validation of whether the transition is allowed.
 * It sends the request and returns/throws based on whatever
 * the backend decides. Any "is this transition allowed?"
 * decision lives on the backend (D2-12), never here
 * (AI-RULES.md §6.2).
 * ============================================================
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function parseErrorMessage(response, fallback) {
  let message = fallback;
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch {
    // Response body wasn't JSON — keep the fallback message.
  }
  return message;
}

export async function getMyDeliveries(accessToken) {
  const response = await fetch(`${API_BASE_URL}/api/deliveries`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        `Failed to load deliveries (status ${response.status})`
      )
    );
  }

  const data = await response.json();
  return data.deliveries ?? [];
}

export async function getDeliveryById(id, accessToken) {
  const response = await fetch(`${API_BASE_URL}/api/deliveries/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        `Failed to load delivery (status ${response.status})`
      )
    );
  }

  const data = await response.json();
  return data.delivery;
}

/**
 * Requests a status transition. This does NOT decide whether
 * the transition is valid — it only asks the backend and
 * surfaces whatever the backend decides. See file header.
 */
export async function updateDeliveryStatus(id, newStatus, accessToken) {
  const response = await fetch(`${API_BASE_URL}/api/deliveries/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        `Status update rejected (status ${response.status})`
      )
    );
  }

  const data = await response.json();
  return data.delivery;
}