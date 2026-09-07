import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useDeliveryUpdates } from "../../lib/useDeliveryUpdates";
import DeliveryTable from "../../components/DeliveryTable";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

export default function DispatcherDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("open");

  const fetchDeliveries = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch("/api/deliveries", {}, token);
      setDeliveries(data.deliveries);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useDeliveryUpdates(fetchDeliveries);

  if (error) {
    return <ErrorState message={error} onRetry={fetchDeliveries} />;
  }

  if (deliveries === null) {
    return <LoadingState message="Loading deliveries…" />;
  }

  const visibleDeliveries =
    filter === "open" ? deliveries.filter((d) => d.status === "PENDING") : deliveries;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Dispatcher Dashboard</h1>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setFilter("open")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              filter === "open" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              filter === "all" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <DeliveryTable
          deliveries={visibleDeliveries}
          onRowClick={(delivery) => navigate(`/dispatcher/deliveries/${delivery.id}`)}
        />
      </div>
    </div>
  );
}