/**
 * Tests for RiderDashboard (D3-1).
 *
 * These are component-level tests. They mock useAuth and the
 * deliveries API client so they don't depend on a real
 * Supabase project or a real backend — neither exists yet
 * (Dev 1's auth foundation and Dev 2's GET /api/deliveries
 * are still pending).
 *
 * IMPORTANT SCOPE NOTE:
 * The acceptance criterion "confirm a delivery assigned to a
 * different rider does not appear" is fundamentally a BACKEND
 * responsibility (D2-9 role-scoping), not something this
 * component can guarantee on its own. What these tests CAN
 * and DO verify:
 *   1. The dashboard renders whatever GET /api/deliveries
 *      returns, with no extra client-side filtering logic
 *      that could mask or duplicate a security decision.
 *   2. Loading / empty / error states behave correctly.
 *   3. (D3-6) A real-time change event triggers a re-fetch
 *      through the same authorized endpoint — not a locally
 *      trusted patch of the realtime payload.
 * The full "different rider's delivery never appears" check
 * must be re-verified as an integration/manual test (D3-9)
 * once Dev 2's real, role-scoped endpoint exists — see the
 * "Testing Performed" notes at the end of this response.
 *
 * The real cross-role real-time scenario from PROJECT_SPEC.md
 * §15 (Dispatcher assigns -> Rider sees it live -> ...) cannot
 * be exercised in a component test — it requires two live
 * browser sessions against a real Supabase project (D2-16) and
 * a real Dispatcher dashboard (D2-18), neither of which exist
 * yet. That manual two-session test is called out explicitly
 * in this response's summary as still outstanding.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RiderDashboard from "./Dashboard";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api/deliveries", () => ({
  getMyDeliveries: vi.fn(),
}));

let capturedRealtimeOptions = null;
vi.mock("../../hooks/useDeliveryRealtime", () => ({
  useDeliveryRealtime: vi.fn((options) => {
    capturedRealtimeOptions = options;
  }),
}));

import { useAuth } from "../../hooks/useAuth";
import { getMyDeliveries } from "../../services/api/deliveries";
import { useDeliveryRealtime } from "../../hooks/useDeliveryRealtime";

const RIDER_A_DELIVERY = {
  id: "d1",
  tracking_code: "RFX-1001",
  customer_name: "Amina Otieno",
  customer_phone: "+254700000001",
  address: "123 Moi Ave, Nairobi",
  item_description: "2x LED bulbs",
  status: "ASSIGNED",
  assigned_rider_id: "rider-a",
};

const RIDER_A_DELIVERY_2 = {
  id: "d2",
  tracking_code: "RFX-1002",
  customer_name: "John Kamau",
  customer_phone: "+254700000002",
  address: "45 Kenyatta Rd, Nairobi",
  item_description: "Phone charger",
  status: "PICKED_UP",
  assigned_rider_id: "rider-a",
};

function mockAuthenticatedAsRiderA() {
  useAuth.mockReturnValue({
    user: { id: "rider-a" },
    profile: { id: "rider-a", role: "RIDER", name: "Rider A" },
    accessToken: "fake-jwt-for-rider-a",
    loading: false,
    error: null,
  });
}

describe("RiderDashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    capturedRealtimeOptions = null;
  });

  it("shows a loading state while auth is resolving", () => {
    useAuth.mockReturnValue({
      user: null,
      profile: null,
      accessToken: null,
      loading: true,
      error: null,
    });

    render(<RiderDashboard />);

    expect(screen.getByTestId("rider-dashboard-loading")).toBeInTheDocument();
  });

  it("shows a loading state while deliveries are being fetched", async () => {
    mockAuthenticatedAsRiderA();
    let resolveFetch;
    getMyDeliveries.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<RiderDashboard />);

    expect(screen.getByTestId("rider-dashboard-loading")).toBeInTheDocument();

    resolveFetch([RIDER_A_DELIVERY]);
    await waitFor(() =>
      expect(screen.getByTestId("rider-dashboard-list")).toBeInTheDocument()
    );
  });

  it("renders only the deliveries returned by the API for the logged-in rider", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries.mockResolvedValue([RIDER_A_DELIVERY, RIDER_A_DELIVERY_2]);

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getAllByTestId("delivery-card")).toHaveLength(2)
    );

    expect(screen.getByText("RFX-1001")).toBeInTheDocument();
    expect(screen.getByText("RFX-1002")).toBeInTheDocument();
    expect(screen.getByText("Amina Otieno")).toBeInTheDocument();
    expect(screen.getByText("John Kamau")).toBeInTheDocument();
  });

  it("displays the current status for each delivery via StatusBadge", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries.mockResolvedValue([RIDER_A_DELIVERY]);

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("delivery-card")).toBeInTheDocument()
    );

    expect(screen.getByTestId("status-badge")).toHaveTextContent("Assigned");
  });

  it("calls the API with the authenticated rider's access token", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries.mockResolvedValue([]);

    render(<RiderDashboard />);

    await waitFor(() => expect(getMyDeliveries).toHaveBeenCalledTimes(1));
    expect(getMyDeliveries).toHaveBeenCalledWith("fake-jwt-for-rider-a");
  });

  it("does NOT re-filter the API response client-side (trusts backend scoping)", async () => {
    // A delivery that (hypothetically, if the backend were
    // buggy) belongs to a different rider. The component
    // must render exactly what the API returns without adding
    // its own ownership check — that check belongs on the
    // backend (D2-9), per AI-RULES.md §5.4/§6.2. This test
    // documents that expectation at the component boundary.
    mockAuthenticatedAsRiderA();
    const otherRidersDelivery = {
      ...RIDER_A_DELIVERY,
      id: "d3",
      tracking_code: "RFX-9999",
      assigned_rider_id: "rider-b",
    };
    getMyDeliveries.mockResolvedValue([otherRidersDelivery]);

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("delivery-card")).toBeInTheDocument()
    );
    // It renders whatever came back — proving there's no
    // hidden client-side filter that could mask a real
    // backend scoping bug during integration testing.
    expect(screen.getByText("RFX-9999")).toBeInTheDocument();
  });

  it("shows an empty state when the rider has no assigned deliveries", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries.mockResolvedValue([]);

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("rider-dashboard-empty")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("delivery-card")).not.toBeInTheDocument();
  });

  it("shows an error state when the API call fails", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries.mockRejectedValue(new Error("Network error"));

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("rider-dashboard-error")).toBeInTheDocument()
    );
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows an error state when auth fails to resolve", () => {
    useAuth.mockReturnValue({
      user: null,
      profile: null,
      accessToken: null,
      loading: false,
      error: new Error("Session expired"),
    });

    render(<RiderDashboard />);

    expect(screen.getByTestId("rider-dashboard-error")).toBeInTheDocument();
  });

  // --- D3-6: real-time subscription behavior ---

  it("subscribes to real-time changes scoped to the logged-in rider", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries.mockResolvedValue([]);

    render(<RiderDashboard />);

    await waitFor(() => expect(useDeliveryRealtime).toHaveBeenCalled());
    expect(capturedRealtimeOptions.filter).toBe(
      "assigned_rider_id=eq.rider-a"
    );
    expect(capturedRealtimeOptions.enabled).toBe(true);
  });

  it("does not enable the real-time subscription until authenticated", () => {
    useAuth.mockReturnValue({
      user: null,
      profile: null,
      accessToken: null,
      loading: false,
      error: null,
    });

    render(<RiderDashboard />);

    expect(capturedRealtimeOptions.enabled).toBe(false);
  });

  it("re-fetches deliveries through the authorized API (not a local patch) when a real-time change fires", async () => {
    mockAuthenticatedAsRiderA();
    getMyDeliveries
      .mockResolvedValueOnce([RIDER_A_DELIVERY])
      .mockResolvedValueOnce([RIDER_A_DELIVERY, RIDER_A_DELIVERY_2]);

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getAllByTestId("delivery-card")).toHaveLength(1)
    );
    expect(getMyDeliveries).toHaveBeenCalledTimes(1);

    // Simulate a real-time change event (e.g. Dispatcher just
    // assigned a second delivery to this rider).
    capturedRealtimeOptions.onChange({
      eventType: "UPDATE",
      new: { id: "d2", assigned_rider_id: "rider-a" },
    });

    // The dashboard must go back through GET /api/deliveries —
    // proving it doesn't trust the realtime payload directly.
    await waitFor(() => expect(getMyDeliveries).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getAllByTestId("delivery-card")).toHaveLength(2)
    );
  });
});