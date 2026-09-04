/**
 * LoadingState — shared component (Task D1.3, PROJECT_SPEC.md §12.2)
 * ---------------------------------------------------------------------
 * SHARED COMPONENT: Developer 2 and Developer 3 should reuse this
 * rather than building their own loading indicators (AI-RULES.md §4.5).
 *
 * Purely presentational — takes no data-fetching logic, just a message.
 *
 * Props:
 *   message (string, optional) — defaults to a generic loading message.
 */
export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-gray-500">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
        role="status"
        aria-label="Loading"
      />
      <p>{message}</p>
    </div>
  );
}
