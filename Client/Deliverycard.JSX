/**
 * DeliveryCard
 *
 * ============================================================
 * TEMP STUB — NOT FINAL. Owned long-term by Dev 1
 * (PROJECT_SPEC.md §12.2 lists this as a required reusable
 * component). This minimal version exists only so Developer 3
 * can build and test the Rider dashboard without waiting on
 * Dev 1. Replace this file entirely when Dev 1's real
 * DeliveryCard lands — do not merge with it.
 * ============================================================
 */

import StatusBadge from "./StatusBadge";

export default function DeliveryCard({ delivery, onClick }) {
  const {
    tracking_code: trackingCode,
    customer_name: customerName,
    address,
    item_description: itemDescription,
    status,
  } = delivery;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="delivery-card"
      className="w-full text-left border rounded-lg p-4 mb-3 bg-white hover:bg-gray-50 transition"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm text-gray-500">
          {trackingCode}
        </span>
        <StatusBadge status={status} />
      </div>
      <p className="font-medium">{customerName}</p>
      <p className="text-sm text-gray-600">{address}</p>
      <p className="text-sm text-gray-600">{itemDescription}</p>
    </button>
  );
}