import StatusBadge from "./StatusBadge";

/**
 * DeliveryCard — shared component (PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * FIX: field names corrected to match the real backend response shape
 * (server/src/controllers/deliveryController.js), confirmed and tested
 * throughout D2-7/D2-8/D2-10:
 *   { id, tracking_code, customer_name, customer_phone, address,
 *     item_description, status, assigned_rider_id, created_at, ... }
 * assigned_rider_id is a bare UUID, not an embedded { id, name } object
 * — the backend does not currently join to users for a rider name.
 *
 * Props:
 *   delivery (object, required)
 *   onClick (function, optional)
 */
export default function DeliveryCard({ delivery, onClick }) {
  const { tracking_code, customer_name, address, item_description, status, assigned_rider_id } =
    delivery;

  return (
    <div
      onClick={onClick}
      className={`min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        onClick ? "cursor-pointer hover:border-gray-300 hover:shadow" : ""
      }`}
    >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-800">{customer_name}</p>
        <p className="truncate text-sm text-gray-500">{tracking_code}</p>
      </div>
      <StatusBadge status={status} />
    </div>

    <p className="mt-3 break-words text-sm text-gray-600">{address}</p>
    <p className="mt-1 break-words text-sm text-gray-600">{item_description}</p>

    <p className="mt-3 truncate text-xs text-gray-400">
      Rider: {assigned_rider_id || "Unassigned"}
    </p>
    </div>
  );
}