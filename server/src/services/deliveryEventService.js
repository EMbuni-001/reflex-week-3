const supabase = require('../config/supabaseClient');

/**
 * Canonical delivery event types (PROJECT_SPEC.md §6.7).
 * All write endpoints that change a delivery's state must record an
 * event through recordEvent() below rather than inserting into
 * delivery_events directly, to avoid duplicating this logic
 * (AI-RULES.md §17.4).
 */
const EVENT_TYPES = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

/**
 * Records a delivery event. Failure to log an event does not throw —
 * the primary action (e.g. creating or assigning a delivery) is more
 * important than its audit trail entry, so we log the failure
 * server-side and return a result the caller can inspect if it cares,
 * rather than forcing every caller into a try/catch.
 */
async function recordEvent({ deliveryId, eventType, performedBy, metadata = null }) {
  const { error } = await supabase.from('delivery_events').insert({
    delivery_id: deliveryId,
    event_type: eventType,
    performed_by: performedBy,
    metadata,
  });

  if (error) {
    console.error(`Failed to record ${eventType} event for delivery ${deliveryId}:`, error);
    return { success: false, error };
  }

  return { success: true };
}

module.exports = { recordEvent, EVENT_TYPES };