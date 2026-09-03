/**
 * Rider Scan — /rider/scan
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-4 (scanning) + D3-5 (confirmation) +
 *             D3-8 (mobile layout)
 * Requirements: PROJECT_SPEC.md §6.4, §6.6, §16, §17.2;
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
 *
 * D3-8 NOTE: this page is the single most mobile-critical
 * screen in the whole app — it's a camera UI a Rider will use
 * one-handed, often outdoors, mid-delivery. Buttons use a
 * min-h-11 (~44px) touch target and stack full-width on narrow
 * screens rather than assuming desktop pointer precision.
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

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmedDelivery, setConfirmedDelivery] = useState(null);

  function handleScan(decodedText) {
    setScannedCode(decodedText);
    setCameraError(null);
    setIsPaused(true);
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
      const delivery = await confirmDelivery(scannedCode, accessToken);
      setConfirmedDelivery(delivery);
    } catch (err) {
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
    <div className="p-4 sm:p-6 max-w-md mx-auto">
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
          <p className="text-lg font-medium mb-4 break-all">{scannedCode}</p>

          {confirmError && (
            <div
              data-testid="confirm-error"
              className="mb-4 text-sm text-red-600"
            >
              {confirmError}
            </div>
          )}

          {/*
            D3-8: buttons stack full-width on narrow screens and
            meet a ~44px minimum touch target, since this screen
            is used one-handed, often mid-delivery.
          */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              data-testid="confirm-delivery-button"
              disabled={isConfirming}
              onClick={handleConfirm}
              className="w-full sm:w-auto min-h-11 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isConfirming ? "Confirming…" : "Confirm Delivery"}
            </button>

            <button
              type="button"
              data-testid="scan-again-button"
              disabled={isConfirming}
              onClick={handleScanAgain}
              className="w-full sm:w-auto min-h-11 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Scan Again
            </button>
          </div>
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
            className="w-full sm:w-auto min-h-11 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Scan Next Delivery
          </button>
        </div>
      )}
    </div>
  );
}