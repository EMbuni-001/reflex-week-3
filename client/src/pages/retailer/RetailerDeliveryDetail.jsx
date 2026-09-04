import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

/**
 * /retailer/deliveries/:id — Task D1.9
 * ---------------------------------------------------------------------
 * Replaces the D1.2 stub. Fetches one delivery via GET /api/deliveries/:id
 * (PROJECT_SPEC.md §10.2) and displays every field Developer 1 owns.
 *
 * CONVERGENCE POINT (per the D1.9 integration note): this page also
 * needs two components owned by Developer 3 — QRCode (D3.4) and
 * DeliveryTimeline (D3.3) — neither of which exist yet. Rather than
 * build placeholder/duplicate versions of either (which would conflict
 * with Developer 3's real components once merged, AI-RULES.md §17.4),
 * both are reserved as clearly marked slots below. Swapping in the
 * real components later is just adding an import and dropping them in
 * — no redesign of this page needed.
 *
 * ASSUMED response shape (F0.2 not available, same pattern as D1.7/D1.8):
 *   { delivery: { id, trackingCode, customerName, customerPhone,
 *                 address, itemDescription, status, assignedRider,
 *                 createdAt, updatedAt, deliveredAt } }
 */
export default function RetailerDeliveryDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);

  const fetchDelivery = useCallback(async () => {
    setError(null);
    setDelivery(null);
    try {
      const data = await apiFetch(`/api/deliveries/${id}`, {}, token);
      setDelivery(data.delivery);
    } catch (err) {
      setError(err.message);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  if (error) {
    return <ErrorState message={error} onRetry={fetchDelivery} />;
  }

  if (delivery === null) {
    return <LoadingState message="Loading delivery…" />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{delivery.customerName}</h1>
          <p className="text-sm text-gray-500">{delivery.trackingCode}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Left/main column — fields Developer 1 owns */}
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 sm:col-span-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Customer phone</p>
            <p className="text-sm text-gray-700">{delivery.customerPhone}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Address</p>
            <p className="text-sm text-gray-700">{delivery.address}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Item description</p>
            <p className="text-sm text-gray-700">{delivery.itemDescription}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Assigned rider</p>
            <p className="text-sm text-gray-700">
              {delivery.assignedRider ? delivery.assignedRider.name : "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Created</p>
            <p className="text-sm text-gray-700">
              {delivery.createdAt ? new Date(delivery.createdAt).toLocaleString() : "—"}
            </p>
          </div>
          {delivery.deliveredAt && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Delivered</p>
              <p className="text-sm text-gray-700">
                {new Date(delivery.deliveredAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* --- INTEGRATION SLOT: Developer 3's DeliveryTimeline (D3.3) ---
              Fed by GET /api/deliveries/:id/events (PROJECT_SPEC.md §10.2).
              Replace this block with:
                <DeliveryTimeline deliveryId={delivery.id} />
              once D3.3 lands. */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-400">Delivery timeline</p>
            <div className="rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
              Timeline component pending — owned by Developer 3 (task D3.3)
            </div>
          </div>
        </div>

        {/* Right column — QR code slot */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">QR code</p>
          {/* --- INTEGRATION SLOT: Developer 3's QRCode (D3.4) ---
              Encodes trackingCode per the team's locked Phase 0 decision.
              Replace this block with:
                <QRCode value={delivery.trackingCode} />
              once D3.4 lands. */}
          <div className="flex aspect-square items-center justify-center rounded border border-dashed border-gray-300 text-center text-sm text-gray-400">
            QR code pending
            <br />
            (Developer 3, task D3.4)
          </div>
        </div>
      </div>
    </div>
  );
}
