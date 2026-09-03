import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import DeliveryTable from "../../components/DeliveryTable";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

/**
 * /retailer/dashboard — Task D1.7
 * ---------------------------------------------------------------------
 * Replaces the D1.2 stub. Fetches the logged-in Retailer Staff user's
 * deliveries via GET /api/deliveries (PROJECT_SPEC.md §10.2) and lists
 * them with DeliveryTable (D1.5).
 *
 * ASSUMED response shape (F0.2 API contract doc not available — same
 * flagged-assumption pattern as D1.5/D1.6, kept consistent with the
 * delivery-object shape documented in DeliveryCard.jsx):
 *   { deliveries: [ { id, trackingCode, customerName, ..., status,
 *                      assignedRider }, ... ] }
 * §10.2 says this endpoint returns deliveries "relevant to the
 * authenticated user/role" — for Retailer Staff that should mean
 * deliveries they created. That scoping is enforced server-side by
 * Developer 2 (D2.7); this page just renders whatever comes back.
 *
 * This page is functionally inert until Developer 2's GET /api/deliveries
 * actually exists — see the D1.7 integration note. Logic is verified
 * here against a mock server matching the shape above.
 */
export default function RetailerDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState(null);
  const [error, setError] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    setError(null);
    setDeliveries(null);
    try {
      const data = await apiFetch("/api/deliveries", {}, token);
      setDeliveries(data.deliveries ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  if (error) {
    return <ErrorState message={error} onRetry={fetchDeliveries} />;
  }

  if (deliveries === null) {
    return <LoadingState message="Loading your deliveries…" />;
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Your Deliveries</h1>
      <DeliveryTable
        deliveries={deliveries}
        onRowClick={(delivery) => navigate(`/retailer/deliveries/${delivery.id}`)}
      />
    </div>
  );
}
