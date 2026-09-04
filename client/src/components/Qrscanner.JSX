/**
 * QRScanner
 *
 * Owned by: Developer 3 (Rider + QR/Barcode workstream)
 * Implements: D3-4
 * Requirements: PROJECT_SPEC.md §6.6 ("Rider must be able to
 *               scan the code using the device camera"), §16
 *
 * ============================================================
 * SCOPE BOUNDARY — READ BEFORE EXTENDING THIS FILE:
 * This component ONLY activates the camera and decodes a QR
 * into a string. It does NOT look up a delivery, does NOT
 * validate the code, and does NOT call any confirmation API.
 * Per the D3-4 task's own integration note: "decoding a value
 * is not confirmation — actual confirmation must go through
 * the backend (D3-5, POST /api/deliveries/:id/confirm)."
 * Keep it that way — confirmation logic belongs in the
 * component/page that consumes onScan, not here.
 * ============================================================
 *
 * Uses `html5-qrcode` (locked Phase 0 decision) for
 * camera-based scanning.
 *
 * Props:
 *   onScan(decodedText)  - called once per successful decode,
 *                          with the raw decoded string,
 *                          unmodified.
 *   onError(message)     - called if the camera can't start
 *                          (e.g. permission denied, no camera
 *                          available).
 *   paused (bool)        - when true, decoded results are
 *                          ignored (used by the consuming page
 *                          to prevent duplicate rapid-fire
 *                          scans of the same code).
 */

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ELEMENT_ID = "reflex-qr-scanner";

export default function QRScanner({ onScan, onError, paused = false }) {
  const scannerRef = useRef(null);
  const lastDecodedRef = useRef(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let isActive = true;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!isActive || pausedRef.current) return;
          // Avoid firing repeatedly for the same static code
          // while it's still in frame.
          if (decodedText === lastDecodedRef.current) return;
          lastDecodedRef.current = decodedText;
          onScan?.(decodedText);
        },
        () => {
          // Per-frame "no QR found" callback — expected
          // constantly while the camera searches. Not an
          // error; intentionally ignored.
        }
      )
      .catch((err) => {
        if (isActive) {
          onError?.(err?.message || "Could not access the camera.");
        }
      });

    return () => {
      isActive = false;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {
          // Scanner may already be stopped/never started
          // successfully — safe to ignore on teardown.
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={SCANNER_ELEMENT_ID} data-testid="qr-scanner-viewport" />;
}