/**
 * ErrorState — shared component (Task D1.3, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: Developer 2 and Developer 3 should reuse this
 * rather than building their own error displays (AI-RULES.md §4.5).
 *
 * Purely presentational. Callers are responsible for deciding *what*
 * message to show (e.g. a parsed API error vs. a generic fallback) —
 * this component just renders it consistently.
 *
 * Props:
 *   message (string, optional) — defaults to a generic error message.
 *   onRetry (function, optional) — if provided, a "Try again" button
 *     is rendered and calls this on click. Omitted entirely if not
 *     provided, rather than rendering a disabled/no-op button.
 *   inline (boolean, optional, default false) — Added in D1.10. When
 *     false (default, unchanged from D1.3), renders the original
 *     full-section version (min-height, centered, generous padding)
 *     for full-page/section failures like "couldn't load deliveries".
 *     When true, renders a compact version that fits inline under a
 *     form field, so Login/DeliveryCreate can reuse this component
 *     instead of a bespoke inline message — see the D1.10 planning
 *     note on why this was added rather than forcing the full-section
 *     version into a small form.
 */
export default function ErrorState({ message = "Something went wrong.", onRetry, inline = false }) {
  if (inline) {
    return (
      <div className="flex flex-col items-start gap-1">
        <p className="text-sm text-red-600">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-gray-600 underline hover:text-gray-800"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Try again
        </button>
      )}
    </div>
  );
}
