/**
 * Rider Delivery Details — /rider/deliveries/:id
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-2 (details/status) + D3-3 (QR display) +
 *             D3-7 (event timeline) + D3-8 (mobile layout)
 * Requirements: PROJECT_SPEC.md §6.4, §6.7, §17.2
 *
 * IMPORTANT DESIGN NOTE (AI-RULES.md §6.2):
 * This component decides which button to SHOW using
 * utils/statusTransitions.js — a display-only mirror of the
 * state machine. It does NOT decide whether a transition is
 * ALLOWED. Every click sends a real request to the backend
 * (PATCH /api/deliveries/:id/status, D2-12) and the resulting
 * UI state reflects the backend's actual decision.
 *
 * ROUTING NOTE (integration point with Dev 1, D1-1):
 * No React Router setup exists yet, so this component takes
 * `deliveryId` as a plain prop rather than reading it via
 * `useParams()`.
 *
 * D3-7 NOTE: event history is fetched once on load and then
 * kept live via useDeliveryEventsRealtime (built in D3-6),
 * satisfying PROJECT_SPEC.md §15 step 9 ("delivery timeline
 * records the event" as part of the live scenario).
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getDeliveryById,
  updateDeliveryStatus,
  getDeliveryEvents,
} from "../../services/api/deliveries";
import { useDeliveryEventsRealtime } from "../../hooks/useDeliveryRealtime";
import StatusBadge from "../../components/StatusBadge";
import QRCode from "../../components/QRCode";
import DeliveryTimeline from "../../components/DeliveryTimeline";
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

  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState(null);

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

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return;
    setEventsError(null);
    try {
      const result = await getDeliveryEvents(deliveryId, accessToken);
      setEvents(result);
    } catch (err) {
      setEventsError(err.message || "Failed to load delivery history.");
    }
  }, [deliveryId, accessToken]);

  useEffect(() => {
    if (authLoading) return;
    fetchDelivery();
    fetchEvents();
  }, [authLoading, fetchDelivery, fetchEvents]);

  // Live timeline updates (D3-7 + D3-6): a new event (e.g. this
  // rider's own status change, or a confirmation) appends
  // without a manual refresh. Re-fetches through the authorized
  // endpoint rather than trusting the realtime payload's shape
  // directly, same principle as the dashboard's real-time hook.
  useDeliveryEventsRealtime({
    deliveryId,
    enabled: Boolean(accessToken && deliveryId),
    onChange: () => {
      fetchEvents();
    },
  });

  async function handleStatusUpdate(targetStatus) {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updated = await updateDeliveryStatus(
        deliveryId,
        targetStatus,
        accessToken
      );
      setDelivery(updated);
    } catch (err) {
      setUpdateError(err.message || "Status update was rejected.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (authLoading || loadingDelivery) {
    return (
      <div data-testid="delivery-details-loading" className="p-4 sm:p-6">
        Loading delivery…
      </div>
    );
  }

  if (authError) {
    return (
      <div
        data-testid="delivery-details-error"
        className="p-4 sm:p-6 text-red-600"
      >
        Could not verify your session. Please log in again.
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        data-testid="delivery-details-error"
        className="p-4 sm:p-6 text-red-600"
      >
        {loadError}
      </div>
    );
  }

  if (!delivery) {
    return (
      <div
        data-testid="delivery-details-not-found"
        className="p-4 sm:p-6 text-gray-500"
      >
        Delivery not found.
      </div>
    );
  }

  const nextStatus = getNextRiderStatus(delivery.status);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/*
        D3-8: single-column, mobile-first layout. No side-by-side
        assumptions — everything stacks vertically, which reads
        correctly on both a narrow phone screen and a wider one.
      */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-500 truncate">
              {delivery.tracking_code}
            </p>
            <h1 className="text-xl font-semibold break-words">
              {delivery.customer_name}
            </h1>
          </div>
          <StatusBadge status={delivery.status} />
        </div>
      </div>

      <div className="mb-4 space-y-1">
        <p className="text-sm text-gray-600 break-words">{delivery.address}</p>
        <p className="text-sm text-gray-600 break-words">
          {delivery.item_description}
        </p>
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

      <div className="mb-6 flex flex-col items-start">
        <p className="text-sm text-gray-500 mb-2">Delivery code</p>
        <QRCode value={delivery.tracking_code} size={160} />
      </div>

      {nextStatus ? (
        <button
          type="button"
          data-testid="status-update-button"
          disabled={isUpdating}
          onClick={() => handleStatusUpdate(nextStatus)}
          // D3-8: min-h-11 (~44px) keeps this a comfortable
          // thumb-sized touch target on a phone; w-full on
          // small screens avoids a cramped narrow button.
          className="w-full sm:w-auto min-h-11 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 mb-6"
        >
          {isUpdating ? "Updating…" : getStatusActionLabel(nextStatus)}
        </button>
      ) : (
        <p data-testid="no-manual-action" className="text-sm text-gray-500 mb-6">
          No manual status action available for this delivery right now.
        </p>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">History</h2>
        {eventsError ? (
          <p data-testid="events-error" className="text-sm text-red-600">
            {eventsError}
          </p>
        ) : (
          <DeliveryTimeline events={events} />
        )}
      </div>
    </div>
  );
}