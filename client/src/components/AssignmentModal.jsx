/**
 * AssignmentModal — shared component (PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * Wraps the rider-selection UI in a modal, called from the Dispatcher
 * delivery detail page. Contains no fetch logic itself — riders and
 * the actual PATCH /api/deliveries/:id/assign call remain owned by
 * whichever page uses this (keeps this component reusable/testable in
 * isolation, same pattern as QRScanner's onScan/onError props).
 *
 * Props:
 *   open (bool, required)
 *   riders (array, required) — [{ id, name, phone }]
 *   isReassign (bool, optional) — changes title wording only
 *   assigning (bool, optional) — disables the button while a request is in flight
 *   error (string, optional)
 *   onAssign (function, required) — called with the selected rider_id
 *   onClose (function, required)
 */
import { useState } from "react";
import ErrorState from "./ErrorState";

export default function AssignmentModal({
  open,
  riders,
  isReassign = false,
  assigning = false,
  error,
  onAssign,
  onClose,
}) {
  const [selectedRiderId, setSelectedRiderId] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800">
          {isReassign ? "Reassign rider" : "Assign rider"}
        </h2>

        <select
          value={selectedRiderId}
          onChange={(e) => setSelectedRiderId(e.target.value)}
          className="mt-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select a rider…</option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.name} ({rider.phone})
            </option>
          ))}
        </select>

        {error && (
          <div className="mt-3">
            <ErrorState message={error} inline />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedRiderId && onAssign(selectedRiderId)}
            disabled={!selectedRiderId || assigning}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {assigning ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}