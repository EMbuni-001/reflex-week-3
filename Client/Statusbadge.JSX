/**
 * StatusBadge
 *
 * ============================================================
 * TEMP STUB — NOT FINAL. Owned long-term by Dev 1
 * (PROJECT_SPEC.md §12.2 lists this as a required reusable
 * component). This minimal version exists only so Developer 3
 * can build and test the Rider dashboard without waiting on
 * Dev 1. Replace this file entirely when Dev 1's real
 * StatusBadge lands — do not merge with it.
 * ============================================================
 *
 * Status values are locked (PROJECT_SPEC.md §7):
 * PENDING, ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED,
 * CANCELLED.
 */

const STATUS_LABELS = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      data-testid="status-badge"
      className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800"
    >
      {label}
    </span>
  );
}