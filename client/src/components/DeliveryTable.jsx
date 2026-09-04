import StatusBadge from "./StatusBadge";

/**
 * DeliveryTable — shared component (Task D1.5, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: same three blocked consumers as DeliveryCard
 * (D1.7, D2.12, D3.1). See DeliveryCard.jsx for the full note on the
 * assumed delivery-object shape and why it's flagged, not locked.
 *
 * Props:
 *   deliveries (array, required) — array of delivery objects (see
 *     DeliveryCard.jsx for the assumed shape).
 *   onRowClick (function, optional) — called with a single delivery
 *     when its row is clicked.
 *
 * Empty state: renders a plain "No deliveries." message instead of an
 * empty table shell — a small UX default, not a new requirement.
 */
export default function DeliveryTable({ deliveries, onRowClick }) {
  if (!deliveries || deliveries.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No deliveries.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-gray-200 text-gray-500">
        <tr>
          <th className="py-2 pr-4 font-medium">Customer</th>
          <th className="py-2 pr-4 font-medium">Address</th>
          <th className="py-2 pr-4 font-medium">Item</th>
          <th className="py-2 pr-4 font-medium">Status</th>
          <th className="py-2 pr-4 font-medium">Rider</th>
        </tr>
      </thead>
      <tbody>
        {deliveries.map((delivery) => (
          <tr
            key={delivery.id}
            onClick={onRowClick ? () => onRowClick(delivery) : undefined}
            className={`border-b border-gray-100 ${
              onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
            }`}
          >
            <td className="py-2 pr-4 text-gray-800">{delivery.customerName}</td>
            <td className="py-2 pr-4 text-gray-600">{delivery.address}</td>
            <td className="py-2 pr-4 text-gray-600">{delivery.itemDescription}</td>
            <td className="py-2 pr-4">
              <StatusBadge status={delivery.status} />
            </td>
            <td className="py-2 pr-4 text-gray-600">
              {delivery.assignedRider ? delivery.assignedRider.name : "Unassigned"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
