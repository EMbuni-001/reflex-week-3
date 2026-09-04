const supabase = require('../config/supabaseClient');
const deliveryEventService = require('./deliveryEventService');
const { EVENT_TYPES } = deliveryEventService;

/**
 * Permitted transitions through THIS endpoint (PROJECT_SPEC.md §7.1).
 * DELIVERED is deliberately excluded — it is only reachable via
 * POST /api/deliveries/:id/confirm (D2-15), which enforces QR/barcode
 * validation per PROJECT_SPEC.md §6.6/§16. Allowing DELIVERED here
 * would let a delivery be marked delivered without ever being scanned.
 *
 * Each entry: fromStatus -> { toStatus: requiredRole }
 * requiredRole is 'RIDER' (must be the delivery's assigned rider) or
 * 'DISPATCHER'.
 */
const TRANSITIONS = {
  ASSIGNED: {
    PICKED_UP: 'RIDER',
    CANCELLED: 'DISPATCHER',
    PENDING: 'DISPATCHER',
  },
  PICKED_UP: {
    OUT_FOR_DELIVERY: 'RIDER',
  },
  OUT_FOR_DELIVERY: {
    // DELIVERED intentionally omitted — must go through /confirm (D2-15)
  },
};

async function updateDeliveryStatus(deliveryId, newStatus, user) {
  const { data: delivery, error: fetchError } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', deliveryId)
    .single();

  if (fetchError || !delivery) {
    const err = new Error('Delivery not found.');
    err.status = 404;
    throw err;
  }

  const currentStatus = delivery.status;
  const allowedFromCurrent = TRANSITIONS[currentStatus] || {};
  const requiredRole = allowedFromCurrent[newStatus];

  if (!requiredRole) {
    const err = new Error(
      `Cannot transition delivery from ${currentStatus} to ${newStatus}.`
    );
    err.status = 409;
    throw err;
  }

  if (requiredRole === 'RIDER') {
    if (user.role !== 'RIDER' || delivery.assigned_rider_id !== user.id) {
      const err = new Error('Only the assigned Rider can perform this transition.');
      err.status = 403;
      throw err;
    }
  }

  if (requiredRole === 'DISPATCHER') {
    if (user.role !== 'DISPATCHER') {
      const err = new Error('Only a Dispatcher can perform this transition.');
      err.status = 403;
      throw err;
    }
  }

  const { data: updatedDelivery, error: updateError } = await supabase
    .from('deliveries')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', deliveryId)
    .eq('status', currentStatus)
    .select()
    .maybeSingle();

  if (updateError) {
    const err = new Error('Failed to update delivery status.');
    err.status = 500;
    throw err;
  }

  if (!updatedDelivery) {
    const err = new Error('Delivery changed before this status update was applied. Please retry.');
    err.status = 409;
    throw err;
  }

  const eventTypeMap = {
    PICKED_UP: EVENT_TYPES.PICKED_UP,
    OUT_FOR_DELIVERY: EVENT_TYPES.OUT_FOR_DELIVERY,
    CANCELLED: EVENT_TYPES.CANCELLED,
    PENDING: EVENT_TYPES.CANCELLED,
  };

  await deliveryEventService.recordEvent({
    deliveryId,
    eventType: eventTypeMap[newStatus],
    performedBy: user.id,
    metadata: { from: currentStatus, to: newStatus },
  });

  return updatedDelivery;
}

module.exports = { updateDeliveryStatus, TRANSITIONS };