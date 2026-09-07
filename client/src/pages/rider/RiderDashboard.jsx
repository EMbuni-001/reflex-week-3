import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useDeliveryUpdates } from "../../lib/useDeliveryUpdates";
import DeliveryCard from "../../components/DeliveryCard";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

export default function RiderDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState(null);
  const [error, setError] = useState(null);

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
    return <LoadingState message="Loading your deliveries…" />;
  }

  return (
      <div className="p-4 sm:p-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">Rider Dashboard</h1>

        {deliveries.length === 0 ? (
          <p className="text-sm text-gray-500">No deliveries assigned to you yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onClick={() => navigate(`/rider/deliveries/${delivery.id}`)}
              />
            ))}
          </div>
        )}
      </div>
  ); 
}