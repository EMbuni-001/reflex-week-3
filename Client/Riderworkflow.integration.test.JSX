/**
 * Rider workflow integration test (D3-9 — Rider-owned slice
 * only).
 *
 * ============================================================
 * SCOPE — READ BEFORE TREATING THIS AS "THE" E2E TEST:
 * This is NOT the full PROJECT_SPEC.md §27 scenario. It does
 * NOT involve a real backend, a real Retailer/Dispatcher UI,
 * real routing, or real Supabase auth/real-time. See
 * docs/qa/E2E-TEST-PLAN.md for why that full scenario cannot
 * run yet and what's blocking it.
 *
 * What THIS test proves: the Rider-owned pages I've built
 * (Dashboard, DeliveryDetails, Scan) correctly compose with
 * each other and with the shared API-client contract I've
 * assumed — i.e. a delivery's status/events flow consistently
 * across all three pages as a Rider would experience them, IF
 * a backend implementing exactly my assumed contract existed.
 * It uses a small in-memory fake "server" (not real fetch/
 * network) that implements the same function signatures as
 * services/api/deliveries.js, so this test exercises the real
 * page components exactly as they call that module.
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiderDashboard from "../../pages/Rider/Dashboard";
import RiderDeliveryDetails from "../../pages/Rider/DeliveryDetails";
import RiderScan from "../../pages/Rider/Scan";

const RIDER_A = { id: "rider-a", role: "RIDER", name: "Rider A" };
const ACCESS_TOKEN = "fake-jwt-for-rider-a";

// --- Fake in-memory "server" ---
// Simulates exactly the contract assumed in
// services/api/deliveries.js, including the security rules
// (rider ownership, valid-state checks) that the real backend
// (D2-9, D2-11, D2-12, D2-15) is responsible for. This is a
// simulation of that contract for testing MY code's use of it
// — it is not a substitute for the real backend actually
// enforcing these rules.
function createFakeServer(initialDelivery) {
  let delivery = { ...initialDelivery };
  let events = [
    { id: "e1", event_type: "CREATED", performed_by_name: "Amina (Retailer)", created_at: "2026-09-01T08:00:00.000Z" },
    { id: "e2", event_type: "ASSIGNED", performed_by_name: "David (Dispatcher)", created_at: "2026-09-01T08:05:00.000Z" },
  ];

  return {
    async getMyDeliveries(token) {
      if (token !== ACCESS_TOKEN) return [];
      return delivery.assigned_rider_id === RIDER_A.id ? [delivery] : [];
    },
    async getDeliveryById(id) {
      if (id !== delivery.id) throw new Error("Delivery not found");
      return delivery;
    },
    async updateDeliveryStatus(id, newStatus, token) {
      if (id !== delivery.id) throw new Error("Delivery not found");
      if (token !== ACCESS_TOKEN || delivery.assigned_rider_id !== RIDER_A.id) {
        throw new Error("This delivery is not assigned to you.");
      }
      const allowed = { ASSIGNED: "PICKED_UP", PICKED_UP: "OUT_FOR_DELIVERY" };
      if (allowed[delivery.status] !== newStatus) {
        throw new Error(
          `Cannot transition from ${delivery.status} to ${newStatus}.`
        );
      }
      delivery = { ...delivery, status: newStatus };
      events = [
        ...events,
        {
          id: `e${events.length + 1}`,
          event_type: newStatus,
          performed_by_name: RIDER_A.name,
          created_at: new Date().toISOString(),
        },
      ];
      return delivery;
    },
    async getDeliveryEvents(id) {
      if (id !== delivery.id) return [];
      return events;
    },
    async confirmDelivery(trackingCode, token) {
      if (trackingCode !== delivery.tracking_code) {
        throw new Error("Unknown delivery code.");
      }
      if (token !== ACCESS_TOKEN || delivery.assigned_rider_id !== RIDER_A.id) {
        throw new Error("This delivery is not assigned to you.");
      }
      if (delivery.status !== "OUT_FOR_DELIVERY") {
        throw new Error("Delivery is not in a confirmable state.");
      }
      delivery = { ...delivery, status: "DELIVERED" };
      events = [
        ...events,
        {
          id: `e${events.length + 1}`,
          event_type: "DELIVERED",
          performed_by_name: RIDER_A.name,
          created_at: new Date().toISOString(),
        },
      ];
      return delivery;
    },
    _getState() {
      return { delivery, events };
    },
  };
}

let fakeServer;

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: RIDER_A,
    profile: RIDER_A,
    accessToken: ACCESS_TOKEN,
    loading: false,
    error: null,
  }),
}));

vi.mock("../../hooks/useDeliveryRealtime", () => ({
  useDeliveryRealtime: vi.fn(),
  useDeliveryEventsRealtime: vi.fn(),
}));

vi.mock("../../services/api/deliveries", () => ({
  getMyDeliveries: (...args) => fakeServer.getMyDeliveries(...args),
  getDeliveryById: (...args) => fakeServer.getDeliveryById(...args),
  updateDeliveryStatus: (...args) => fakeServer.updateDeliveryStatus(...args),
  getDeliveryEvents: (...args) => fakeServer.getDeliveryEvents(...args),
  confirmDelivery: (...args) => fakeServer.confirmDelivery(...args),
}));

// QRCode calls the real `qrcode` library, which isn't
// installable in this sandbox — mocked so this test can run
// once dependencies are actually installed, without depending
// on that library's own (separately tested) behavior.
vi.mock("../../components/QRCode", () => ({
  default: ({ value }) => <div data-testid="qrcode-stub">{value}</div>,
}));

let capturedScannerProps = null;
vi.mock("../../components/QRScanner", () => ({
  default: (props) => {
    capturedScannerProps = props;
    return <div data-testid="qr-scanner-stub" />;
  },
}));

describe("Rider workflow integration (D3-9 — Rider-owned slice)", () => {
  beforeEach(() => {
    capturedScannerProps = null;
    fakeServer = createFakeServer({
      id: "d1",
      tracking_code: "RFX-1001",
      customer_name: "Amina Otieno",
      customer_phone: "+254700000001",
      address: "123 Moi Ave, Nairobi",
      item_description: "2x LED bulbs",
      status: "ASSIGNED",
      assigned_rider_id: "rider-a",
    });
  });

  it("shows the delivery on the dashboard once assigned (simulating a completed Dispatcher assignment, D2-11)", async () => {
    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getByText("RFX-1001")).toBeInTheDocument()
    );
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Assigned");
  });

  it("does not show the delivery on the dashboard if assigned to a different rider", async () => {
    fakeServer = createFakeServer({
      id: "d1",
      tracking_code: "RFX-1001",
      customer_name: "Amina Otieno",
      status: "ASSIGNED",
      assigned_rider_id: "rider-b",
    });

    render(<RiderDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId("rider-dashboard-empty")).toBeInTheDocument()
    );
  });

  it("carries a delivery through the full Rider-owned lifecycle: view -> pick up -> out for delivery -> scan -> confirm, with a consistent event history", async () => {
    const user = userEvent.setup();

    // Step: Rider views delivery details (simulating navigation
    // from the dashboard to /rider/deliveries/d1).
    const { unmount: unmountDetails1 } = render(
      <RiderDeliveryDetails deliveryId="d1" />
    );
    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toHaveTextContent(
        "Mark as Picked Up"
      )
    );

    // Step: Rider marks as picked up.
    await user.click(screen.getByTestId("status-update-button"));
    await waitFor(() =>
      expect(screen.getByTestId("status-badge")).toHaveTextContent(
        "Picked Up"
      )
    );

    // Step: Rider marks as out for delivery.
    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toHaveTextContent(
        "Mark as Out for Delivery"
      )
    );
    await user.click(screen.getByTestId("status-update-button"));
    await waitFor(() =>
      expect(screen.getByTestId("status-badge")).toHaveTextContent(
        "Out for Delivery"
      )
    );

    // Once OUT_FOR_DELIVERY, no more manual status buttons —
    // confirmation happens via QR scan instead.
    await waitFor(() =>
      expect(screen.getByTestId("no-manual-action")).toBeInTheDocument()
    );

    // Event history should now show creation, assignment, and
    // both status changes so far.
    expect(
      screen.getAllByTestId("delivery-timeline-item")
    ).toHaveLength(4);

    unmountDetails1();

    // Step: Rider navigates to /rider/scan and scans this
    // delivery's QR code (decoded value = tracking_code, per
    // the locked D3-3 identifier decision).
    const { unmount: unmountScan } = render(<RiderScan />);
    capturedScannerProps.onScan("RFX-1001");

    await waitFor(() =>
      expect(screen.getByTestId("confirm-delivery-button")).toBeInTheDocument()
    );
    await user.click(screen.getByTestId("confirm-delivery-button"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-success")).toHaveTextContent(
        "DELIVERED"
      )
    );
    unmountScan();

    // Step: back on the delivery details view, status and
    // history both reflect the confirmation.
    render(<RiderDeliveryDetails deliveryId="d1" />);
    await waitFor(() =>
      expect(screen.getByTestId("status-badge")).toHaveTextContent(
        "Delivered"
      )
    );
    await waitFor(() =>
      expect(
        screen.getAllByTestId("delivery-timeline-item").length
      ).toBeGreaterThanOrEqual(5)
    );
  });

  it("rejects confirmation when scanned before reaching OUT_FOR_DELIVERY, and does not advance the delivery's real state", async () => {
    // Delivery is still ASSIGNED — never picked up.
    const user = userEvent.setup();
    render(<RiderScan />);
    capturedScannerProps.onScan("RFX-1001");

    await user.click(screen.getByTestId("confirm-delivery-button"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-error")).toHaveTextContent(
        "Delivery is not in a confirmable state."
      )
    );
    expect(screen.queryByTestId("confirm-success")).not.toBeInTheDocument();

    // Confirm the fake server's actual state was never advanced.
    expect(fakeServer._getState().delivery.status).toBe("ASSIGNED");
  });

  it("rejects confirmation for a delivery assigned to a different rider, and does not advance the delivery's real state", async () => {
    fakeServer = createFakeServer({
      id: "d1",
      tracking_code: "RFX-1001",
      status: "OUT_FOR_DELIVERY",
      assigned_rider_id: "rider-b",
    });

    const user = userEvent.setup();
    render(<RiderScan />);
    capturedScannerProps.onScan("RFX-1001");

    await user.click(screen.getByTestId("confirm-delivery-button"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-error")).toHaveTextContent(
        "This delivery is not assigned to you."
      )
    );
    expect(screen.queryByTestId("confirm-success")).not.toBeInTheDocument();
    expect(fakeServer._getState().delivery.status).toBe("OUT_FOR_DELIVERY");
  });
});