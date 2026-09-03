/**
 * statusTransitions.js
 *
 * ============================================================
 * DISPLAY-ONLY. This file grants nothing.
 *
 * This is a UI convenience: it mirrors the delivery state
 * machine from PROJECT_SPEC.md §7 so the Rider UI can decide
 * which button(s) to *show* for the current status. It exists
 * purely to avoid showing meaningless/impossible actions to
 * the user.
 *
 * It is explicitly NOT a source of authorization. Per
 * AI-RULES.md §6.2: "The frontend may display available
 * actions, but the backend remains responsible for validating
 * the transition." The real decision is made by Dev 2's
 * PATCH /api/deliveries/:id/status (D2-12). If this file ever
 * disagrees with the backend — stale copy, bug, whatever — the
 * backend's rejection wins, and the UI must surface that
 * rejection rather than assume its own button was correct.
 *
 * Only transitions a RIDER is allowed to *initiate* are
 * modeled here (PROJECT_SPEC.md §4.3, §6.4: a Rider updates
 * delivery status and confirms delivery). Reassignment
 * (ASSIGNED -> PENDING) and cancellation (ASSIGNED ->
 * CANCELLED) are Dispatcher actions per PROJECT_SPEC.md §4.2 /
 * §7.1 and are intentionally NOT offered here — that UI
 * belongs to Dev 2/Dispatcher workstream, not Rider.
 * ============================================================
 */

// Rider-initiated forward progression only.
const RIDER_NEXT_STATUS = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "OUT_FOR_DELIVERY",
  // OUT_FOR_DELIVERY -> DELIVERED is handled by QR confirmation
  // (D3-5 / POST /api/deliveries/:id/confirm), not this manual
  // status button, per PROJECT_SPEC.md §6.6. Intentionally
  // omitted here.
};

const STATUS_ACTION_LABELS = {
  PICKED_UP: "Mark as Picked Up",
  OUT_FOR_DELIVERY: "Mark as Out for Delivery",
};

/**
 * Returns the single next status a Rider may manually request
 * from the current status, or null if there is no
 * Rider-manual next step (e.g. already DELIVERED/CANCELLED, or
 * the next step is QR confirmation instead of a button).
 *
 * This is a suggestion for the UI only — see file header.
 */
export function getNextRiderStatus(currentStatus) {
  return RIDER_NEXT_STATUS[currentStatus] ?? null;
}

/**
 * Human-readable label for the button that requests the given
 * target status.
 */
export function getStatusActionLabel(targetStatus) {
  return STATUS_ACTION_LABELS[targetStatus] ?? `Mark as ${targetStatus}`;
}