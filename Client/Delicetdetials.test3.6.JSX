/**
 * Tests for RiderDeliveryDetails (D3-2).
 *
 * Mocks useAuth and the deliveries API client, same approach
 * as Dashboard.test.jsx, since no real Supabase/backend exists
 * yet.
 *
 * SCOPE NOTE — matches the task's own testing instructions:
 * "perform a valid transition; attempt to force an invalid one
 * via direct API call (should be rejected server-side,
 * confirming D2-12 rather than relying on this UI)."
 *
 * These are component tests, so "the API call" here is the
 * mocked updateDeliveryStatus() function. What they verify is
 * that THIS COMPONENT:
 *   1. only offers the mirrored next-step button for the
 *      current status (never an arbitrary/invalid one),
 *   2. on a successful backend response, updates its displayed
 *      status from that response (not by guessing),
 *   3. on a backend rejection, shows the rejection and leaves
 *      the displayed status unchanged — i.e. it does not
 *      pretend the transition happened just because a button
 *      was clicked.
 * The real end-to-end proof that D2-12 itself rejects invalid
 * transitions requires Dev 2's actual backend and belongs to
 * D3-9/D3-10 integration testing, not this file.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiderDeliveryDetails from "./DeliveryDetails";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api/deliveries", () => ({
  getDeliveryById: vi.fn(),
  updateDeliveryStatus: vi.fn(),
}));

// QRCode has its own dedicated test suite (QRCode.test.jsx).
// Mocked here so these status-transition tests aren't coupled
// to the QR library's async generation behavior.
vi.mock("../../components/QRCode", () => ({
  default: ({ value }) => <div data-testid="qrcode-stub">{value}</div>,
}));

import { useAuth } from "../../hooks/useAuth";
import {
  getDeliveryById,
  updateDeliveryStatus,
} from "../../services/api/deliveries";

const BASE_DELIVERY = {
  id: "d1",
  tracking_code: "RFX-1001",
  customer_name: "Amina Otieno",
  customer_phone: "+254700000001",
  address: "123 Moi Ave, Nairobi",
  item_description: "2x LED bulbs",
  status: "ASSIGNED",
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

describe("RiderDeliveryDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows a loading state while fetching the delivery", () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockReturnValue(new Promise(() => {})); // never resolves

    render(<RiderDeliveryDetails deliveryId="d1" />);

    expect(screen.getByTestId("delivery-details-loading")).toBeInTheDocument();
  });

  it("renders delivery details once loaded", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue(BASE_DELIVERY);

    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByText("Amina Otieno")).toBeInTheDocument()
    );
    expect(screen.getByText("RFX-1001")).toBeInTheDocument();
    expect(screen.getByText("123 Moi Ave, Nairobi")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Assigned");
  });

  it("offers only the single mirrored next step for ASSIGNED (Mark as Picked Up)", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({ ...BASE_DELIVERY, status: "ASSIGNED" });

    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toBeInTheDocument()
    );
    expect(screen.getByTestId("status-update-button")).toHaveTextContent(
      "Mark as Picked Up"
    );
  });

  it("offers only the single mirrored next step for PICKED_UP (Mark as Out for Delivery)", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({
      ...BASE_DELIVERY,
      status: "PICKED_UP",
    });

    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toBeInTheDocument()
    );
    expect(screen.getByTestId("status-update-button")).toHaveTextContent(
      "Mark as Out for Delivery"
    );
  });

  it("offers no manual action button for OUT_FOR_DELIVERY (confirmation happens via QR, not a status button)", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({
      ...BASE_DELIVERY,
      status: "OUT_FOR_DELIVERY",
    });

    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("no-manual-action")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("status-update-button")).not.toBeInTheDocument();
  });

  it("offers no manual action button for a terminal status (DELIVERED)", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({
      ...BASE_DELIVERY,
      status: "DELIVERED",
    });

    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("no-manual-action")).toBeInTheDocument()
    );
  });

  it("on a successful transition, updates the displayed status from the backend's response", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({ ...BASE_DELIVERY, status: "ASSIGNED" });
    updateDeliveryStatus.mockResolvedValue({
      ...BASE_DELIVERY,
      status: "PICKED_UP",
    });

    const user = userEvent.setup();
    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toBeInTheDocument()
    );

    await user.click(screen.getByTestId("status-update-button"));

    expect(updateDeliveryStatus).toHaveBeenCalledWith(
      "d1",
      "PICKED_UP",
      "fake-jwt-for-rider-a"
    );

    await waitFor(() =>
      expect(screen.getByTestId("status-badge")).toHaveTextContent("Picked Up")
    );
    // Next mirrored step should now reflect the NEW status.
    expect(screen.getByTestId("status-update-button")).toHaveTextContent(
      "Mark as Out for Delivery"
    );
  });

  it("when the backend rejects the transition, shows the rejection and does NOT change the displayed status", async () => {
    // This is the exact scenario the task calls out: the UI
    // offered a button (its own mirrored guess), but the
    // backend is the real authority and can still say no
    // (e.g. someone else changed the delivery in the
    // meantime). The UI must not pretend it succeeded.
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({ ...BASE_DELIVERY, status: "ASSIGNED" });
    updateDeliveryStatus.mockRejectedValue(
      new Error("Transition not allowed from current state")
    );

    const user = userEvent.setup();
    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toBeInTheDocument()
    );

    await user.click(screen.getByTestId("status-update-button"));

    await waitFor(() =>
      expect(screen.getByTestId("status-update-error")).toHaveTextContent(
        "Transition not allowed from current state"
      )
    );

    // Status must remain exactly what it was before the click —
    // no optimistic update happened.
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Assigned");
  });

  it("disables the button while an update is in flight to prevent duplicate requests", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockResolvedValue({ ...BASE_DELIVERY, status: "ASSIGNED" });
    let resolveUpdate;
    updateDeliveryStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );

    const user = userEvent.setup();
    render(<RiderDeliveryDetails deliveryId="d1" />);

    await waitFor(() =>
      expect(screen.getByTestId("status-update-button")).toBeInTheDocument()
    );

    await user.click(screen.getByTestId("status-update-button"));

    expect(screen.getByTestId("status-update-button")).toBeDisabled();

    resolveUpdate({ ...BASE_DELIVERY, status: "PICKED_UP" });
    await waitFor(() =>
      expect(screen.getByTestId("status-badge")).toHaveTextContent("Picked Up")
    );
  });

  it("shows an error state when the delivery fails to load", async () => {
    mockAuthenticatedAsRiderA();
    getDeliveryById.mockRejectedValue(new Error("Delivery not found"));

    render(<RiderDeliveryDetails deliveryId="does-not-exist" />);

    await waitFor(() =>
      expect(screen.getByTestId("delivery-details-error")).toHaveTextContent(
        "Delivery not found"
      )
    );
  });
});