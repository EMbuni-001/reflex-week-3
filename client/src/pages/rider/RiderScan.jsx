import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import QRScanner from "../../components/QRScanner";
import ErrorState from "../../components/ErrorState";

/**
 * /rider/scan — real implementation, replaces D1.2 stub.
 *
 * QRScanner (D3-4) only decodes a string — it does NOT know which
 * delivery that corresponds to. Since POST /api/deliveries/:id/confirm
 * (D2-15) needs the delivery's real id in the URL, not the tracking
 * code, this page first looks up the scanned tracking_code against
 * the Rider's own assigned deliveries (GET /api/deliveries, already
 * Rider-scoped server-side) to find the matching id, then calls
 * confirm with both. This also lets us show a clear "not your
 * delivery" message before ever hitting the confirm endpoint.
 */
export default function RiderScan() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState("scanning"); // scanning | checking | confirming | success | error
  const [message, setMessage] = useState(null);
  const [confirmedDelivery, setConfirmedDelivery] = useState(null);

  useEffect(() => {
    function handleUnhandledRejection(event) {
      if (event.reason?.name === "AbortError" && event.reason?.message?.includes("play()")) {
        // Known benign browser behavior when the camera <video> element
        // is removed while still loading (e.g. fast navigation away from
        // /rider/scan). Not an application bug — safe to suppress.
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  const handleScan = useCallback(
    async (trackingCode) => {
      setStatus("checking");
      setMessage(null);

      try {
        const data = await apiFetch("/api/deliveries", {}, token);
        const match = data.deliveries.find((d) => d.tracking_code === trackingCode);

        if (!match) {
          setStatus("error");
          setMessage("This QR code doesn't match any delivery assigned to you.");
          return;
        }

        setStatus("confirming");

        const confirmData = await apiFetch(
          `/api/deliveries/${match.id}/confirm`,
          { method: "POST", body: JSON.stringify({ tracking_code: trackingCode }) },
          token
        );

        setConfirmedDelivery(confirmData.delivery);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    },
    [token]
  );

  function handleScanAgain() {
    setStatus("scanning");
    setMessage(null);
    setConfirmedDelivery(null);
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Scan QR Code</h1>

      {status === "scanning" && (
        <div className="mx-auto max-w-sm overflow-hidden rounded-lg border border-gray-200">
          <QRScanner
            onScan={handleScan}
            onError={(err) => {
              setStatus("error");
              setMessage(err);
            }}
          />
        </div>
      )}

      {(status === "checking" || status === "confirming") && (
        <p className="text-sm text-gray-500">
          {status === "checking" ? "Checking code…" : "Confirming delivery…"}
        </p>
      )}

      {status === "success" && confirmedDelivery && (
        <div className="mx-auto max-w-sm rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-green-700">Delivery confirmed!</p>
          <p className="text-sm text-gray-700">{confirmedDelivery.customer_name}</p>
          <p className="text-xs text-gray-500">{confirmedDelivery.tracking_code}</p>
          <button
            onClick={() => navigate(`/rider/deliveries/${confirmedDelivery.id}`)}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View delivery
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="mx-auto max-w-sm">
          <ErrorState message={message} onRetry={handleScanAgain} />
        </div>
      )}
    </div>
  );
}