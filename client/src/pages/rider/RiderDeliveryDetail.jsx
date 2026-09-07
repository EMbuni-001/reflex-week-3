import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useDeliveryUpdates } from "../../lib/useDeliveryUpdates";
import StatusBadge from "../../components/StatusBadge";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import DeliveryTimeline from "../../components/DeliveryTimeline";

const NEXT_TRANSITION = {
  ASSIGNED: { status: "PICKED_UP", label: "Mark as Picked Up" },
  PICKED_UP: { status: "OUT_FOR_DELIVERY", label: "Mark as Out for Delivery" },
};

export default function RiderDeliveryDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchDelivery = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch(`/api/deliveries/${id}`, {}, token);
      setDelivery(data.delivery);
    } catch (err) {
      setError(err.message);
    }
  }, [id, token]);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await apiFetch(`/api/deliveries/${id}/events`, {}, token);
      setEvents(data.events);
    } catch (err) {
      setEventsError(err.message);
    } finally {
      setEventsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDelivery();
    fetchEvents();
  }, [fetchDelivery, fetchEvents]);

  useDeliveryUpdates(
    useCallback(() => {
      fetchDelivery();
      fetchEvents();
    }, [fetchDelivery, fetchEvents])
  );

  async function handleUpdateStatus(nextStatus) {
    setUpdating(true);
    setUpdateError(null);
    try {
      const data = await apiFetch(
        `/api/deliveries/${id}/status`,
        { method: "PATCH", body: JSON.stringify({ status: nextStatus }) },
        token
      );
      setDelivery(data.delivery);
      fetchEvents();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDelivery} />;
  }

  if (delivery === null) {
    return <LoadingState message="Loading delivery…" />;
  }

  const next = NEXT_TRANSITION[delivery.status];

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{delivery.customer_name}</h1>
          <p className="text-sm text-gray-500">{delivery.tracking_code}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="min-w-0 space-y-4 rounded-lg border border-gray-200 bg-white p-4 sm:col-span-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Customer phone</p>
            <p className="text-sm text-gray-700">{delivery.customer_phone}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Address</p>
            <p className="text-sm text-gray-700">{delivery.address}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Item description</p>
            <p className="text-sm text-gray-700">{delivery.item_description}</p>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-400">Delivery timeline</p>
            <DeliveryTimeline events={events} loading={eventsLoading} error={eventsError} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">Actions</p>

          {next && (
            <button
              onClick={() => handleUpdateStatus(next.status)}
              disabled={updating}
              className="mb-2 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? "Updating…" : next.label}
            </button>
          )}

          {delivery.status === "OUT_FOR_DELIVERY" && (
            <button
              onClick={() => navigate("/rider/scan")}
              className="w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Scan QR to Confirm Delivery
            </button>
          )}

          {!next && delivery.status !== "OUT_FOR_DELIVERY" && (
            <p className="text-sm text-gray-500">No actions available for this delivery.</p>
          )}

          {updateError && (
            <div className="mt-2">
              <ErrorState message={updateError} inline />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}