/**
 * Tests for RiderScan (D3-4 scanning + D3-5 confirmation).
 *
 * Mocks QRScanner, useAuth, and confirmDelivery so these tests
 * exercise this page's own logic only, matching the exact test
 * scenarios required by the D3-5 task:
 *   1. confirm as the correct rider -> success
 *   2. attempt confirmation as the wrong rider -> rejected
 *   3. attempt confirmation from an invalid state -> rejected
 *
 * Since there is no real backend yet, "correct rider" /
 * "wrong rider" / "invalid state" are simulated via the mocked
 * confirmDelivery resolving or rejecting — exactly mirroring
 * what a real backend response would look like. The critical
 * property under test in every rejection case is the same:
 * the UI must NOT show a confirmed/DELIVERED state unless the
 * (mocked) backend actually returned one.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiderScan from "./Scan";

let capturedScannerProps = null;

vi.mock("../../components/QRScanner", () => ({
  default: (props) => {
    capturedScannerProps = props;
    return <div data-testid="qr-scanner-stub" />;
  },
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../services/api/deliveries", () => ({
  confirmDelivery: vi.fn(),
}));

import { useAuth } from "../../hooks/useAuth";
import { confirmDelivery } from "../../services/api/deliveries";

function mockAuthenticatedAsRiderA() {
  useAuth.mockReturnValue({
    user: { id: "rider-a" },
    profile: { id: "rider-a", role: "RIDER", name: "Rider A" },
    accessToken: "fake-jwt-for-rider-a",
    loading: false,
    error: null,
  });
}

async function renderAndScan(code = "RFX-1001") {
  const user = userEvent.setup();
  render(<RiderScan />);
  capturedScannerProps.onScan(code);
  return user;
}

describe("RiderScan — confirmation (D3-5)", () => {
  beforeEach(() => {
    capturedScannerProps = null;
    mockAuthenticatedAsRiderA();
  });

  it("does not call confirmDelivery just from a decode alone", async () => {
    await renderAndScan("RFX-1001");
    expect(confirmDelivery).not.toHaveBeenCalled();
  });

  it("shows an enabled Confirm Delivery button after a scan, not auto-triggered", async () => {
    await renderAndScan("RFX-1001");
    const confirmButton = screen.getByTestId("confirm-delivery-button");
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).not.toBeDisabled();
  });

  // --- Scenario 1: correct rider, valid state -> success ---
  it("SCENARIO: confirms successfully as the correct rider and reflects DELIVERED", async () => {
    confirmDelivery.mockResolvedValue({
      id: "d1",
      tracking_code: "RFX-1001",
      status: "DELIVERED",
    });

    const user = await renderAndScan("RFX-1001");
    await user.click(screen.getByTestId("confirm-delivery-button"));

    expect(confirmDelivery).toHaveBeenCalledWith(
      "RFX-1001",
      "fake-jwt-for-rider-a"
    );

    await waitFor(() =>
      expect(screen.getByTestId("confirm-success")).toBeInTheDocument()
    );
    expect(screen.getByTestId("confirm-success")).toHaveTextContent(
      "DELIVERED"
    );
    // The scan-result / confirm button must be gone once
    // confirmed — no lingering "confirm again" affordance.
    expect(screen.queryByTestId("confirm-delivery-button")).not.toBeInTheDocument();
  });

  // --- Scenario 2: wrong rider -> rejected ---
  it("SCENARIO: rejects confirmation when the delivery is not assigned to this rider, and does NOT show DELIVERED", async () => {
    confirmDelivery.mockRejectedValue(
      new Error("This delivery is not assigned to you.")
    );

    const user = await renderAndScan("RFX-1001");
    await user.click(screen.getByTestId("confirm-delivery-button"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-error")).toHaveTextContent(
        "This delivery is not assigned to you."
      )
    );

    // Absolutely must not show a success state.
    expect(screen.queryByTestId("confirm-success")).not.toBeInTheDocument();
    // The scan result (with a retry option) must still be shown.
    expect(screen.getByTestId("scan-result")).toBeInTheDocument();
  });

  // --- Scenario 3: invalid state -> rejected ---
  it("SCENARIO: rejects confirmation when the delivery is in an invalid state, and does NOT show DELIVERED", async () => {
    confirmDelivery.mockRejectedValue(
      new Error("Delivery is not in a confirmable state.")
    );

    const user = await renderAndScan("RFX-1001");
    await user.click(screen.getByTestId("confirm-delivery-button"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-error")).toHaveTextContent(
        "Delivery is not in a confirmable state."
      )
    );
    expect(screen.queryByTestId("confirm-success")).not.toBeInTheDocument();
  });

  it("disables Confirm and Scan Again buttons while a confirmation request is in flight", async () => {
    let resolveConfirm;
    confirmDelivery.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      })
    );

    const user = await renderAndScan("RFX-1001");
    await user.click(screen.getByTestId("confirm-delivery-button"));

    expect(screen.getByTestId("confirm-delivery-button")).toBeDisabled();
    expect(screen.getByTestId("scan-again-button")).toBeDisabled();

    resolveConfirm({ id: "d1", tracking_code: "RFX-1001", status: "DELIVERED" });
    await waitFor(() =>
      expect(screen.getByTestId("confirm-success")).toBeInTheDocument()
    );
  });

  it("lets the Rider scan again after a rejected confirmation, clearing the previous error", async () => {
    confirmDelivery.mockRejectedValue(new Error("Rejected."));

    const user = await renderAndScan("RFX-1001");
    await user.click(screen.getByTestId("confirm-delivery-button"));
    await waitFor(() =>
      expect(screen.getByTestId("confirm-error")).toBeInTheDocument()
    );

    await user.click(screen.getByTestId("scan-again-button"));

    expect(screen.queryByTestId("confirm-error")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scan-result")).not.toBeInTheDocument();
    expect(screen.getByTestId("qr-scanner-stub")).toBeInTheDocument();
  });

  it("clears a previous confirmation outcome when a fresh code is scanned", async () => {
    confirmDelivery.mockResolvedValue({
      id: "d1",
      tracking_code: "RFX-1001",
      status: "DELIVERED",
    });

    const user = await renderAndScan("RFX-1001");
    await user.click(screen.getByTestId("confirm-delivery-button"));
    await waitFor(() =>
      expect(screen.getByTestId("confirm-success")).toBeInTheDocument()
    );

    // Simulate scanning again after "Scan Next Delivery"
    await user.click(screen.getByTestId("scan-again-button"));
    capturedScannerProps.onScan("RFX-2002");

    expect(screen.queryByTestId("confirm-success")).not.toBeInTheDocument();
    expect(screen.getByText("RFX-2002")).toBeInTheDocument();
  });

  it("shows a camera error message when the scanner reports one", () => {
    render(<RiderScan />);
    capturedScannerProps.onError("Camera permission denied");

    expect(screen.getByTestId("scan-camera-error")).toHaveTextContent(
      "Camera permission denied"
    );
  });
});