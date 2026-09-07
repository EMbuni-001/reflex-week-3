import StatusBadge from "./StatusBadge";

/**
 * DeliveryTable — shared component (PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * FIX: same field-name correction as DeliveryCard.jsx — see that
 * file's comment for the confirmed real backend shape.
 *
 * Props:
 *   deliveries (array, required)
 *   onRowClick (function, optional)
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
            <td className="py-2 pr-4 text-gray-800">{delivery.customer_name}</td>
            <td className="py-2 pr-4 text-gray-600">{delivery.address}</td>
            <td className="py-2 pr-4 text-gray-600">{delivery.item_description}</td>
            <td className="py-2 pr-4">
              <StatusBadge status={delivery.status} />
            </td>
            <td className="py-2 pr-4 text-gray-600">
              {delivery.assigned_rider_id || "Unassigned"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}