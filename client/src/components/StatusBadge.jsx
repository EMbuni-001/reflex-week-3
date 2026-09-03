/**
 * StatusBadge — shared component (Task D1.4, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: Developer 2 (dispatcher views) and Developer 3
 * (rider views) use this rather than building their own status
 * indicators (AI-RULES.md §4.5).
 *
 * Covers exactly the six status values locked as a project constraint
 * (PROJECT_SPEC.md §7), with human-readable labels matching §17.1
 * ("Pending", "Assigned", "Picked Up", "Out for Delivery", "Delivered",
 * "Cancelled"). Callers pass the raw backend status string — this
 * component does the label/color formatting internally so every usage
 * across the app stays visually consistent.
 *
 * Props:
 *   status (string, required) — one of PENDING, ASSIGNED, PICKED_UP,
 *     OUT_FOR_DELIVERY, DELIVERED, CANCELLED.
 *
 * If an unrecognized value is ever passed (bad data, future bug), it
 * renders plainly in a neutral style rather than throwing — this is a
 * defensive fallback, not a new status value.
 */
const STATUS_STYLES = {
  PENDING: { label: "Pending", classes: "bg-gray-100 text-gray-700" },
  ASSIGNED: { label: "Assigned", classes: "bg-blue-100 text-blue-700" },
  PICKED_UP: { label: "Picked Up", classes: "bg-amber-100 text-amber-700" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", classes: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Delivered", classes: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", classes: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? { label: status, classes: "bg-gray-100 text-gray-700" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.classes}`}
    >
      {style.label}
    </span>
  );
}
