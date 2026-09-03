/**
 * Rider Dashboard — /rider/dashboard
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-1
 * Requirements: PROJECT_SPEC.md §4.3 (Rider permissions),
 *               §6.4 (Rider workflow — "view assigned deliveries")
 *
 * Shows the deliveries assigned to the currently logged-in
 * Rider, with their current status.
 *
 * Security note (AI-RULES.md §5.4, §6.2): this component does
 * NOT filter deliveries by rider itself. It trusts the backend
 * (GET /api/deliveries) to return only deliveries relevant to
 * the authenticated user's role, since authorization must be
 * enforced server-side, not client-side.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyDeliveries } from "../../services/api/deliveries";
import DeliveryCard from "../../components/DeliveryCard";

export default function RiderDashboard() {
  const { accessToken, loading: authLoading, error: authError } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setLoadingDeliveries(false);
      return;
    }

    let isMounted = true;

    async function loadDeliveries() {
      setLoadingDeliveries(true);
      setFetchError(null);
      try {
        const results = await getMyDeliveries(accessToken);
        if (isMounted) {
          setDeliveries(results);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || "Failed to load deliveries.");
        }
      } finally {
        if (isMounted) {
          setLoadingDeliveries(false);
        }
      }
    }

    loadDeliveries();

    return () => {
      isMounted = false;
    };
  }, [accessToken, authLoading]);

  if (authLoading || loadingDeliveries) {
    return (
      <div data-testid="rider-dashboard-loading" className="p-6">
        Loading your deliveries…
      </div>
    );
  }

  if (authError) {
    return (
      <div data-testid="rider-dashboard-error" className="p-6 text-red-600">
        Could not verify your session. Please log in again.
      </div>
    );
  }

  if (fetchError) {
    return (
      <div data-testid="rider-dashboard-error" className="p-6 text-red-600">
        {fetchError}
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div data-testid="rider-dashboard-empty" className="p-6 text-gray-500">
        You have no assigned deliveries right now.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">My Deliveries</h1>
      <div data-testid="rider-dashboard-list">
        {deliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} />
        ))}
      </div>
    </div>
  );
}