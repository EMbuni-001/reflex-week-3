/**
 * Rider Dashboard — /rider/dashboard
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-1 (initial load) + D3-6 (real-time updates)
 * Requirements: PROJECT_SPEC.md §4.3 (Rider permissions),
 *               §6.4 (Rider workflow — "view assigned deliveries"),
 *               §15 (real-time synchronization)
 *
 * Shows the deliveries assigned to the currently logged-in
 * Rider, with their current status, and updates automatically
 * when an assignment or status change happens elsewhere
 * (e.g. Dispatcher assigns a new delivery) — no manual refresh
 * required, per PROJECT_SPEC.md §15.
 *
 * Security note (AI-RULES.md §5.4, §6.2): this component does
 * NOT filter deliveries by rider itself, for either the initial
 * load or the real-time subscription's filter. The real-time
 * filter below is a performance/relevance optimization (only
 * subscribe to rows that could matter to this rider) — it is
 * NOT a substitute for backend authorization. The backend
 * (GET /api/deliveries) remains the source of truth for what
 * this rider is allowed to see; a real-time event only
 * triggers a re-fetch through that same authorized endpoint.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getMyDeliveries } from "../../services/api/deliveries";
import { useDeliveryRealtime } from "../../hooks/useDeliveryRealtime";
import DeliveryCard from "../../components/DeliveryCard";

export default function RiderDashboard() {
  const {
    user,
    accessToken,
    loading: authLoading,
    error: authError,
  } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const loadDeliveries = useCallback(async () => {
    if (!accessToken) return;
    setFetchError(null);
    try {
      const results = await getMyDeliveries(accessToken);
      setDeliveries(results);
    } catch (err) {
      setFetchError(err.message || "Failed to load deliveries.");
    } finally {
      setLoadingDeliveries(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setLoadingDeliveries(false);
      return;
    }

    setLoadingDeliveries(true);
    loadDeliveries();
  }, [accessToken, authLoading, loadDeliveries]);

  // Real-time: re-fetch (via the same authorized endpoint,
  // not a locally-trusted patch) whenever a delivery relevant
  // to this rider changes. Re-fetching rather than trusting the
  // realtime payload directly keeps the backend as the single
  // source of truth for what this rider is allowed to see.
  useDeliveryRealtime({
    filter: user ? `assigned_rider_id=eq.${user.id}` : undefined,
    enabled: Boolean(user && accessToken),
    onChange: () => {
      loadDeliveries();
    },
  });

  if (authLoading || loadingDeliveries) {
    return (
      <div data-testid="rider-dashboard-loading" className="p-4 sm:p-6">
        Loading your deliveries…
      </div>
    );
  }

  if (authError) {
    return (
      <div data-testid="rider-dashboard-error" className="p-4 sm:p-6 text-red-600">
        Could not verify your session. Please log in again.
      </div>
    );
  }

  if (fetchError) {
    return (
      <div data-testid="rider-dashboard-error" className="p-4 sm:p-6 text-red-600">
        {fetchError}
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div data-testid="rider-dashboard-empty" className="p-4 sm:p-6 text-gray-500">
        You have no assigned deliveries right now.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">My Deliveries</h1>
      <div data-testid="rider-dashboard-list">
        {deliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} />
        ))}
      </div>
    </div>
  );
}