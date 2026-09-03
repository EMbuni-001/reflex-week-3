/**
 * Rider Scan — /rider/scan
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-4 (scanning) + D3-5 (confirmation)
 * Requirements: PROJECT_SPEC.md §6.4, §6.6, §16;
 *               AI-RULES.md §7 (QR/barcode security),
 *               AI-RULES.md §11.2 (named security-critical
 *               integration point)
 *
 * ============================================================
 * SECURITY BOUNDARY — READ BEFORE MODIFYING:
 * Scanning a QR code only decodes a string. It does NOT mean
 * the delivery is confirmed. Confirmation happens ONLY when
 * POST /api/deliveries/confirm returns success. This page:
 *   - never marks a delivery DELIVERED based on a decode alone
 *   - never checks "is this assigned to me?" locally — that
 *     check happens exclusively on the backend (D2-15)
 *   - shows the backend's exact rejection message on failure,
 *     and does NOT change the displayed outcome to success
 *   - does not retry, does not assume, does not guess
 * If you're tempted to add a local "looks valid" shortcut here
 * to make a demo look smoother, don't — that's exactly the
 * client-side trust shortcut AI-RULES.md §11.2/§7 forbids.
 * ============================================================
 */

import { useState } from "react";
import QRScanner from "../../components/QRScanner";
import { useAuth } from "../../hooks/useAuth";
import { confirmDelivery } from "../../services/api/deliveries";

export default function RiderScan() {
  const { accessToken } = useAuth();

  const [scannedCode, setScannedCode] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scannerInstanceKey, setScannerInstanceKey] = useState(0);

  // Confirmation state — separate from camera/decode state, so
  // a scan and a confirmation attempt are never conflated.
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmedDelivery, setConfirmedDelivery] = useState(null);

  function handleScan(decodedText) {
    setScannedCode(decodedText);
    setCameraError(null);
    setIsPaused(true);
    // A fresh scan always clears any previous confirmation
    // outcome — a new code means a new, unconfirmed attempt.
    setConfirmError(null);
    setConfirmedDelivery(null);
  }

  function handleError(message) {
    setCameraError(message);
  }

  async function handleConfirm() {
    if (!scannedCode) return;
    setIsConfirming(true);
    setConfirmError(null);
    try {
      // The backend is the ONLY authority here. Whatever it
      // returns (success or rejection) is exactly what this
      // page reflects — no local interpretation, no optimistic
      // update before this resolves.
      const delivery = await confirmDelivery(scannedCode, accessToken);
      setConfirmedDelivery(delivery);
    } catch (err) {
      // Deliberately generic fallback text only if the backend
      // gave us nothing usable — the real message from the
      // backend (e.g. "not assigned to this rider", "invalid
      // state for confirmation") is shown as-is otherwise.
      setConfirmError(err.message || "Delivery confirmation was rejected.");
    } finally {
      setIsConfirming(false);
    }
  }

  function handleScanAgain() {
    setScannedCode(null);
    setCameraError(null);
    setIsPaused(false);
    setConfirmError(null);
    setConfirmedDelivery(null);
    setScannerInstanceKey((key) => key + 1);
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Scan Delivery Code</h1>

      {cameraError && (
        <div data-testid="scan-camera-error" className="mb-4 text-sm text-red-600">
          {cameraError}
        </div>
      )}

      {!scannedCode && (
        <div className="mb-4">
          <QRScanner
            key={scannerInstanceKey}
            onScan={handleScan}
            onError={handleError}
            paused={isPaused}
          />
        </div>
      )}

      {scannedCode && !confirmedDelivery && (
        <div data-testid="scan-result" className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Scanned code</p>
          <p className="text-lg font-medium mb-4">{scannedCode}</p>

          {confirmError && (
            <div
              data-testid="confirm-error"
              className="mb-4 text-sm text-red-600"
            >
              {confirmError}
            </div>
          )}

          <button
            type="button"
            data-testid="confirm-delivery-button"
            disabled={isConfirming}
            onClick={handleConfirm}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 mr-2"
          >
            {isConfirming ? "Confirming…" : "Confirm Delivery"}
          </button>

          <button
            type="button"
            data-testid="scan-again-button"
            disabled={isConfirming}
            onClick={handleScanAgain}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Scan Again
          </button>
        </div>
      )}

      {confirmedDelivery && (
        <div data-testid="confirm-success" className="mb-4">
          <p className="text-sm text-gray-500 mb-1">
            {confirmedDelivery.tracking_code}
          </p>
          <p className="text-lg font-medium text-green-700 mb-4">
            Delivery confirmed — status: {confirmedDelivery.status}
          </p>

          <button
            type="button"
            data-testid="scan-again-button"
            onClick={handleScanAgain}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Scan Next Delivery
          </button>
        </div>
      )}
    </div>
  );
}