import StatusBadge from "./StatusBadge";

/**
 * DeliveryCard — shared component (Task D1.5, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: blocks D1.7 (mine), D2.12 (Developer 2's Dispatcher
 * dashboard), and D3.1 (Developer 3's Rider dashboard) — all three
 * should reuse this rather than building their own card (AI-RULES.md
 * §4.5).
 *
 * ASSUMED delivery-object shape (F0.2 API contract doc not available;
 * documented here as an explicit, flagged assumption per AI-RULES.md
 * §2.3 — NOT a confirmed team contract):
 *   {
 *     id, trackingCode, customerName, customerPhone, address,
 *     itemDescription, status, assignedRider: { id, name } | null,
 *     createdAt
 *   }
 * If Developer 2's actual API differs (e.g. snake_case fields, or a
 * bare assignedRiderId instead of an embedded object), this is a
 * mapping fix wherever the API response is fetched — not a redesign
 * of this component.
 *
 * Props:
 *   delivery (object, required) — see shape above.
 *   onClick (function, optional) — called when the card is clicked.
 *     Kept optional and router-agnostic so this component has no
 *     dependency on react-router and stays usable in isolation
 *     (e.g. the /dev/components preview page).
 */
export default function DeliveryCard({ delivery, onClick }) {
  const { trackingCode, customerName, address, itemDescription, status, assignedRider } =
    delivery;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        onClick ? "cursor-pointer hover:border-gray-300 hover:shadow" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800">{customerName}</p>
          <p className="text-sm text-gray-500">{trackingCode}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="mt-3 text-sm text-gray-600">{address}</p>
      <p className="mt-1 text-sm text-gray-600">{itemDescription}</p>

      <p className="mt-3 text-xs text-gray-400">
        Rider: {assignedRider ? assignedRider.name : "Unassigned"}
      </p>
    </div>
  );
}
