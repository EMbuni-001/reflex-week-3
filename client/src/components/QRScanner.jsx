import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ELEMENT_ID = "reflex-qr-scanner";

export default function QRScanner({ onScan, onError, paused = false }) {
  const scannerRef = useRef(null);
  const lastDecodedRef = useRef(null);
  const pausedRef = useRef(paused);
  const isRunningRef = useRef(false);

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
          if (decodedText === lastDecodedRef.current) return;
          lastDecodedRef.current = decodedText;
          onScan?.(decodedText);
        },
        () => {
          // expected per-frame "no QR found" callback, ignored
        }
      )
      .then(() => {
        // Only mark as running if the component is still mounted by
        // the time start() actually resolves — if cleanup already ran
        // (fast unmount, e.g. quick navigation or no camera available
        // in a dev/emulated environment), stop it immediately instead
        // of leaving a running scanner with isRunningRef never set.
        if (isActive) {
          isRunningRef.current = true;
        } else {
          scanner.stop().catch(() => {});
        }
      })
      .catch((err) => {
        // start() itself failed (permission denied, no camera, etc.)
        // — isRunningRef stays false, so cleanup below won't attempt
        // to stop a scanner that never actually started.
        if (isActive) {
          onError?.(err?.message || "Could not access the camera.");
        }
      });

    return () => {
      isActive = false;
      if (isRunningRef.current) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // Best-effort cleanup — safe to ignore.
          })
          .finally(() => {
            isRunningRef.current = false;
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={SCANNER_ELEMENT_ID} data-testid="qr-scanner-viewport" />;
}