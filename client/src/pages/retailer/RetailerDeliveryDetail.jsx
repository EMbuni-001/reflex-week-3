import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useDeliveryUpdates } from "../../lib/useDeliveryUpdates";
import StatusBadge from "../../components/StatusBadge";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import DeliveryTimeline from "../../components/DeliveryTimeline";
import QRCode from "../../components/QRCode";

export default function RetailerDeliveryDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

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
          <h1 className="text-2xl font-semibold text-gray-800">{delivery.customer_name}</h1>
          <p className="text-sm text-gray-500">{delivery.tracking_code}</p>
        </div>
        <StatusBadge status={delivery.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 sm:col-span-2">
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
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Assigned rider</p>
            <p className="text-sm text-gray-700">
              {delivery.assigned_rider_id ? delivery.assigned_rider_id : "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Created</p>
            <p className="text-sm text-gray-700">
              {delivery.created_at
                ? new Date(delivery.created_at).toLocaleString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
          {delivery.delivered_at && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Delivered</p>
              <p className="text-sm text-gray-700">
                {new Date(delivery.delivered_at).toLocaleString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-400">Delivery timeline</p>
            <DeliveryTimeline events={events} loading={eventsLoading} error={eventsError} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">QR code</p>
          <QRCode value={delivery.tracking_code} />
        </div>
      </div>
    </div>
  );
}