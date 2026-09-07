/**
 * ConfirmationDialog — shared component (PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * Generic "are you sure?" modal. No delivery-specific logic — takes a
 * message and two callbacks, so any page can reuse it for any
 * confirm/cancel decision (AI-RULES.md §4.5).
 *
 * Props:
 *   open (bool, required) — whether the dialog is visible.
 *   title (string, optional)
 *   message (string, required)
 *   confirmLabel (string, optional) — default "Confirm"
 *   cancelLabel (string, optional) — default "Cancel"
 *   onConfirm (function, required)
 *   onCancel (function, required)
 */
export default function ConfirmationDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}