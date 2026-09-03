/**
 * DeliveryTimeline
 *
 * Owned by: Developer 3 (built first per this task's own
 * integration note: "whoever needs it first should build it
 * and notify the others")
 * Implements: D3-7
 * Requirements: PROJECT_SPEC.md §6.7 (delivery history and
 *               audit trail — event type, delivery ID,
 *               performer, timestamp), §12.2 (required
 *               reusable component)
 *
 * ============================================================
 * SHARED COMPONENT — genuinely reusable, no Rider-specific
 * logic. Per the D3-7 task, Dev 1's Retailer detail view and
 * the Dispatcher view are also expected to use this component
 * rather than building their own (AI-RULES.md §4.5 — avoid
 * duplicate implementations of the same UI). If you're Dev 1
 * or Dev 2 reading this: please import and use this file
 * directly instead of writing a second timeline component.
 * ============================================================
 *
 * This component is intentionally fetching-agnostic: it takes
 * an `events` array as a prop rather than fetching internally.
 * This lets each consuming page (Rider, Retailer, Dispatcher)
 * load events however fits its own data pattern, without being
 * forced into this component's fetching choices.
 *
 * PERFORMER DISPLAY NAME — FLAGGED GAP (see also
 * services/api/deliveries.js header):
 * PROJECT_SPEC.md §11.3 defines `performed_by` as a user
 * reference, not a name. This component prefers
 * `event.performed_by_name` if present, and falls back to
 * showing the raw `event.performed_by` id if not, rather than
 * breaking. A real display name from the backend is the better
 * outcome — flagged for Dev 2 to confirm.
 *
 * ORDERING: this component does NOT re-sort events — it
 * renders them in the order given. If the backend's ordering
 * assumption (oldest first, see services/api/deliveries.js)
 * turns out to be wrong, only the caller/API client needs to
 * change, not this component.
 */

const EVENT_TYPE_LABELS = {
  CREATED: "Delivery created",
  ASSIGNED: "Rider assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function formatEventType(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

function formatPerformer(event) {
  return event.performed_by_name || event.performed_by || "Unknown";
}

function formatTimestamp(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return date.toLocaleString();
}

export default function DeliveryTimeline({ events = [] }) {
  if (events.length === 0) {
    return (
      <div data-testid="delivery-timeline-empty" className="text-sm text-gray-500">
        No history recorded yet.
      </div>
    );
  }

  return (
    <ol data-testid="delivery-timeline" className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          data-testid="delivery-timeline-item"
          className="border-l-2 border-gray-200 pl-3"
        >
          <p className="font-medium text-sm">{formatEventType(event.event_type)}</p>
          <p className="text-xs text-gray-500">
            {formatPerformer(event)} · {formatTimestamp(event.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}