const EVENT_TYPE_LABELS = {
  CREATED: "Delivery created",
  ASSIGNED: "Rider assigned",
  REASSIGNED: "Delivery reassigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function formatEventType(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType || "Delivery event";
}

function formatPerformer(event) {
  return event.performed_by_name || event.performed_by || "Unknown user";
}

function formatTimestamp(createdAt) {
  if (!createdAt) return "Time unavailable";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return String(createdAt);

  return date.toLocaleString();
}

export default function DeliveryTimeline({ events = [] }) {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <p data-testid="delivery-timeline-empty" className="text-sm text-gray-500">
        No history recorded yet.
      </p>
    );
  }

  return (
    <ol data-testid="delivery-timeline" className="space-y-3">
      {events.map((event, index) => (
        <li
          key={event.id || `${event.event_type || "event"}-${event.created_at || index}`}
          data-testid="delivery-timeline-item"
          className="border-l-2 border-gray-200 pl-3"
        >
          <p className="text-sm font-medium">{formatEventType(event.event_type)}</p>
          <p className="text-xs text-gray-500">
            {formatPerformer(event)} - {formatTimestamp(event.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}