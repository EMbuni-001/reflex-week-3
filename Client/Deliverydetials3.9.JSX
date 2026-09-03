/**
 * Rider Delivery Details — /rider/deliveries/:id
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-2
 * Requirements: PROJECT_SPEC.md §6.4 (Rider: view delivery
 *               details, update status only through permitted
 *               transitions)
 *
 * IMPORTANT DESIGN NOTE (AI-RULES.md §6.2):
 * This component decides which button to SHOW using
 * utils/statusTransitions.js — a display-only mirror of the
 * state machine. It does NOT decide whether a transition is
 * ALLOWED. Every click sends a real request to the backend
 * (PATCH /api/deliveries/:id/status, D2-12) and the resulting
 * UI state reflects the backend's actual decision:
 *   - success  -> delivery status updates from the backend's
 *                 response, not from an optimistic guess.
 *   - rejected -> the backend's error is shown, and the
 *                 delivery's displayed status is left
 *                 unchanged, because the transition did not
 *                 actually happen.
 * This means even if statusTransitions.js is ever wrong or
 * stale, this UI cannot itself cause an invalid transition —
 * it can only ever fail to offer a valid one, never force an
 * invalid one through.
 *
 * ROUTING NOTE (integration point with Dev 1, D1-1):
 * No React Router setup exists yet, so this component takes
 * `deliveryId` as a plain prop rather than reading it via
 * `useParams()`. Once Dev 1's router is in place for
 * `/rider/deliveries/:id`, wrap this component with a thin
 * adapter (or add `useParams()` directly here) to supply
 * `deliveryId` from the URL. This keeps the component testable
 * in isolation right now without depending on router setup
 * that doesn't exist yet.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getDeliveryById,
  updateDeliveryStatus,
} from "../../services/api/deliveries";
import StatusBadge from "../../components/StatusBadge";
import QRCode from "../../components/QRCode";
import {
  getNextRiderStatus,
  getStatusActionLabel,
} from "../../utils/statusTransitions";

export default function RiderDeliveryDetails({ deliveryId }) {
  const { accessToken, loading: authLoading, error: authError } = useAuth();

  const [delivery, setDelivery] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchDelivery = useCallback(async () => {
    if (!accessToken) return;
    setLoadingDelivery(true);
    setLoadError(null);
    try {
      const result = await getDeliveryById(deliveryId, accessToken);
      setDelivery(result);
    } catch (err) {
      setLoadError(err.message || "Failed to load delivery.");
    } finally {
      setLoadingDelivery(false);
    }
  }, [deliveryId, accessToken]);

  useEffect(() => {
    if (authLoading) return;
    fetchDelivery();
  }, [authLoading, fetchDelivery]);

  async function handleStatusUpdate(targetStatus) {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      // The backend is the sole authority on whether this
      // transition is actually allowed (AI-RULES.md §6.2). We
      // do not update local state until it confirms success.
      const updated = await updateDeliveryStatus(
        deliveryId,
        targetStatus,
        accessToken
      );
      setDelivery(updated);
    } catch (err) {
      // Transition was rejected server-side. Leave the
      // delivery's displayed status exactly as it was — do
      // NOT assume the button click succeeded.
      setUpdateError(err.message || "Status update was rejected.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (authLoading || loadingDelivery) {
    return (
      <div data-testid="delivery-details-loading" className="p-6">
        Loading delivery…
      </div>
    );
  }

  if (authError) {
    return (
      <div data-testid="delivery-details-error" className="p-6 text-red-600">
        Could not verify your session. Please log in again.
      </div>
    );
  }

  if (loadError) {
    return (
      <div data-testid="delivery-details-error" className="p-6 text-red-600">
        {loadError}
      </div>
    );
  }

  if (!delivery) {
    return (
      <div data-testid="delivery-details-not-found" className="p-6 text-gray-500">
        Delivery not found.
      </div>
    );
  }

  const nextStatus = getNextRiderStatus(delivery.status);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">{delivery.tracking_code}</p>
          <h1 className="text-xl font-semibold">{delivery.customer_name}</h1>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="mb-4 space-y-1">
        <p className="text-sm text-gray-600">{delivery.address}</p>
        <p className="text-sm text-gray-600">{delivery.item_description}</p>
        <p className="text-sm text-gray-600">{delivery.customer_phone}</p>
      </div>

      {updateError && (
        <div
          data-testid="status-update-error"
          className="mb-4 text-sm text-red-600"
        >
          {updateError}
        </div>
      )}

      {/*
        QR display note (D3-3 integration): shown here mainly
        so this task has a real, working consumer without
        waiting on Dev 1's Retailer/Dispatcher detail views.
        In practice, the QR is more useful displayed to
        whoever hands off the package (Retailer/Dispatcher)
        since the Rider is the one scanning it, not viewing
        their own screen's code — coordinate final placement
        with Dev 1 rather than assuming this is the only place
        it belongs.
      */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Delivery code</p>
        <QRCode value={delivery.tracking_code} size={160} />
      </div>

      {nextStatus ? (
        <button
          type="button"
          data-testid="status-update-button"
          disabled={isUpdating}
          onClick={() => handleStatusUpdate(nextStatus)}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isUpdating ? "Updating…" : getStatusActionLabel(nextStatus)}
        </button>
      ) : (
        <p
          data-testid="no-manual-action"
          className="text-sm text-gray-500"
        >
          No manual status action available for this delivery right now.
        </p>
      )}
    </div>
  );
}