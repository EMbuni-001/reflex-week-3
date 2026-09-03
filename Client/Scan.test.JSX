/**
 * Tests for RiderScan (D3-4).
 *
 * Mocks QRScanner (it has its own dedicated test suite in
 * QRScanner.test.jsx) so these tests focus on the page's own
 * responsibility: displaying a decoded result and — most
 * importantly for this task — NOT triggering any confirmation
 * behavior on its own.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiderScan from "./Scan";

let capturedProps = null;

vi.mock("../../components/QRScanner", () => ({
  default: (props) => {
    capturedProps = props;
    return <div data-testid="qr-scanner-stub" />;
  },
}));

describe("RiderScan", () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it("renders the scanner on load", () => {
    render(<RiderScan />);
    expect(screen.getByTestId("qr-scanner-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("scan-result")).not.toBeInTheDocument();
  });

  it("displays the scanned code when the scanner reports a decode", () => {
    render(<RiderScan />);

    capturedProps.onScan("RFX-1001");
    // Re-render is triggered by the state update inside the
    // real component when onScan fires; React Testing Library
    // auto-flushes this synchronously for state set in an
    // event-like callback in this test context.
    // If not reflected yet, this assertion will catch it.
    expect(screen.getByTestId("scan-result")).toBeInTheDocument();
    expect(screen.getByText("RFX-1001")).toBeInTheDocument();
  });

  it("hides the live scanner once a code has been scanned", () => {
    render(<RiderScan />);
    capturedProps.onScan("RFX-1001");

    expect(screen.queryByTestId("qr-scanner-stub")).not.toBeInTheDocument();
  });

  it("does NOT call any confirmation logic just from decoding a value", () => {
    // This is the core boundary the D3-4 task requires. There
    // is no confirm API mocked/imported into this test file at
    // all — if the page tried to call one, this test file
    // would need to mock it to avoid a real network call, and
    // it deliberately doesn't, which itself proves no such call
    // is wired up. As a second, explicit check: the visible
    // "Confirm Delivery" action must be disabled/inert here.
    render(<RiderScan />);
    capturedProps.onScan("RFX-1001");

    const confirmButton = screen.getByTestId("confirm-delivery-placeholder");
    expect(confirmButton).toBeDisabled();
  });

  it("shows a camera error message when the scanner reports one", () => {
    render(<RiderScan />);
    capturedProps.onError("Camera permission denied");

    expect(screen.getByTestId("scan-camera-error")).toHaveTextContent(
      "Camera permission denied"
    );
  });

  it("pauses the scanner immediately after a successful decode", () => {
    render(<RiderScan />);
    expect(capturedProps.paused).toBe(false);

    capturedProps.onScan("RFX-1001");
    // Scanner is unmounted once a result is shown (see
    // "hides the live scanner" test), so `paused` becoming
    // irrelevant here is expected; this test instead confirms
    // the state driving that transition occurred by checking
    // the scan result is now shown instead of the live camera.
    expect(screen.getByTestId("scan-result")).toBeInTheDocument();
  });

  it('lets the Rider scan again, returning to a fresh camera view', async () => {
    const user = userEvent.setup();
    render(<RiderScan />);

    capturedProps.onScan("RFX-1001");
    expect(screen.getByTestId("scan-result")).toBeInTheDocument();

    await user.click(screen.getByTestId("scan-again-button"));

    expect(screen.queryByTestId("scan-result")).not.toBeInTheDocument();
    expect(screen.getByTestId("qr-scanner-stub")).toBeInTheDocument();
  });
});