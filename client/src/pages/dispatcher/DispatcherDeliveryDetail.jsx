import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useDeliveryUpdates } from "../../lib/useDeliveryUpdates";
import StatusBadge from "../../components/StatusBadge";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import DeliveryTimeline from "../../components/DeliveryTimeline";
import AssignmentModal from "../../components/AssignmentModal";

export default function DispatcherDeliveryDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);

  const [riders, setRiders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [deliveryData, ridersData] = await Promise.all([
        apiFetch(`/api/deliveries/${id}`, {}, token),
        apiFetch("/api/riders", {}, token),
      ]);
      setDelivery(deliveryData.delivery);
      setRiders(ridersData.riders);
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
    fetchAll();
    fetchEvents();
  }, [fetchAll, fetchEvents]);

  useDeliveryUpdates(
    useCallback(() => {
      fetchAll();
      fetchEvents();
    }, [fetchAll, fetchEvents])
  );

  async function handleAssign(riderId) {
    setAssigning(true);
    setAssignError(null);
    try {
      const data = await apiFetch(
        `/api/deliveries/${id}/assign`,
        { method: "PATCH", body: JSON.stringify({ rider_id: riderId }) },
        token
      );
      setDelivery(data.delivery);
      fetchEvents();
      setModalOpen(false);
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchAll} />;
  }

  if (delivery === null) {
    return <LoadingState message="Loading delivery…" />;
  }

  const canAssign = delivery.status === "PENDING" || delivery.status === "ASSIGNED";

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

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-gray-400">Delivery timeline</p>
            <DeliveryTimeline events={events} loading={eventsLoading} error={eventsError} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">Rider</p>
          <p className="mb-3 text-sm text-gray-700">
            {delivery.assigned_rider_id || "Unassigned"}
          </p>

          {canAssign ? (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {delivery.status === "ASSIGNED" ? "Reassign rider" : "Assign rider"}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              This delivery is {delivery.status} and can no longer be assigned or reassigned.
            </p>
          )}
        </div>
      </div>

      <AssignmentModal
        open={modalOpen}
        riders={riders}
        isReassign={delivery.status === "ASSIGNED"}
        assigning={assigning}
        error={assignError}
        onAssign={handleAssign}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}