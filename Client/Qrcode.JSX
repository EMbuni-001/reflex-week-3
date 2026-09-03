/**
 * QRCode
 *
 * Owned by: Developer 3 (Rider + QR/Barcode workstream)
 * Implements: D3-3
 * Requirements: PROJECT_SPEC.md §6.6 ("Each delivery must have
 *               a unique identifier that can be represented as
 *               a QR code"), §16 (QR-code generation/display)
 *
 * ============================================================
 * SHARED COMPONENT — this is genuinely owned by Dev 3
 * long-term (unlike DeliveryCard/StatusBadge, which are
 * Dev 1's and only temporarily stubbed here). Per
 * PROJECT_SPEC.md §12.2, QRCode is a required reusable
 * component, and the D3-3 task explicitly notes that Dev 1's
 * Retailer/Dispatcher detail views may also render it.
 *
 * To make that reuse painless, this component is intentionally
 * generic: it takes a plain string `value` to encode and has
 * no Rider-specific naming, fetching, or business logic. Any
 * view — Rider, Retailer, or Dispatcher — can import this
 * unchanged.
 * ============================================================
 *
 * PAYLOAD FORMAT NOTE — NOT A LOCKED DECISION:
 * Phase 0 locked "QR identifier: tracking_code" but did not
 * specify the exact encoded payload shape (raw string vs. a
 * structured wrapper). This component encodes exactly
 * whatever string is passed as `value` with zero
 * transformation — the current call site (DeliveryDetails.jsx)
 * passes the raw `tracking_code`. If the team later decides on
 * a structured payload (e.g. JSON, or a URL), only the call
 * site needs to change — this component doesn't care what the
 * string means.
 *
 * Uses the `qrcode` library (locked Phase 0 decision).
 */

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

export default function QRCode({ value, size = 200, altText }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!value) {
      setDataUrl(null);
      setError(null);
      return undefined;
    }

    setError(null);

    QRCodeLib.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to generate QR code.");
          setDataUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!value) {
    return (
      <div data-testid="qrcode-missing" className="text-sm text-gray-400">
        No code available.
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="qrcode-error" className="text-sm text-red-600">
        Could not generate QR code.
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div data-testid="qrcode-loading" className="text-sm text-gray-400">
        Generating code…
      </div>
    );
  }

  return (
    <img
      data-testid="qrcode-image"
      src={dataUrl}
      width={size}
      height={size}
      alt={altText || `QR code for ${value}`}
    />
  );
}