/**
 * Rider Scan — /rider/scan
 *
 * Owned by: Developer 3 (Rider workstream)
 * Implements: D3-4
 * Requirements: PROJECT_SPEC.md §6.4 (Rider: scan a QR/barcode),
 *               §6.6, §16 (QR scanning interface)
 *
 * ============================================================
 * SCOPE BOUNDARY:
 * This page decodes a QR code and shows the result. It does
 * NOT call any confirmation API. Per the D3-4 task's own
 * integration note: "decoding a value is not confirmation —
 * actual confirmation must go through the backend (D3-5)."
 * The "Confirm Delivery" action below is a placeholder that
 * will be wired to POST /api/deliveries/:id/confirm in D3-5 —
 * it is intentionally NOT implemented here.
 * ============================================================
 */

import { useState } from "react";
import QRScanner from "../../components/QRScanner";

export default function RiderScan() {
  const [scannedCode, setScannedCode] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  // Pausing the scanner after a successful decode prevents the
  // camera from immediately re-triggering onScan while the
  // result is being shown to the user.
  const [isPaused, setIsPaused] = useState(false);
  // Remounting the scanner via `key` gives it a clean internal
  // "last decoded" state when the Rider chooses to scan again.
  const [scannerInstanceKey, setScannerInstanceKey] = useState(0);

  function handleScan(decodedText) {
    setScannedCode(decodedText);
    setCameraError(null);
    setIsPaused(true);
  }

  function handleError(message) {
    setCameraError(message);
  }

  function handleScanAgain() {
    setScannedCode(null);
    setCameraError(null);
    setIsPaused(false);
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

      {scannedCode && (
        <div data-testid="scan-result" className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Scanned code</p>
          <p className="text-lg font-medium mb-4">{scannedCode}</p>

          {/*
            D3-5 will wire this to
            POST /api/deliveries/:id/confirm. Left as a visible
            placeholder rather than a working call, so this
            task's scope stays limited to decoding, per the
            task's own integration note.
          */}
          <button
            type="button"
            data-testid="confirm-delivery-placeholder"
            disabled
            className="rounded-md bg-gray-300 text-gray-600 px-4 py-2 text-sm font-medium cursor-not-allowed mr-2"
            title="Confirmation is implemented in a later task (D3-5)"
          >
            Confirm Delivery
          </button>

          <button
            type="button"
            data-testid="scan-again-button"
            onClick={handleScanAgain}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
}