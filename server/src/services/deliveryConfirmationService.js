const supabase = require('../config/supabaseClient');
const deliveryEventService = require('./deliveryEventService');
const { EVENT_TYPES } = deliveryEventService;

/**
 * QR/barcode confirmation (PROJECT_SPEC.md §6.6, §16).
 * The most security-critical write in the API — every check below is
 * mandatory and must run in this order:
 *   1. delivery exists
 *   2. submitted tracking_code actually matches this delivery
 *      (defends against calling this endpoint with an arbitrary :id
 *      without having genuinely scanned that delivery's code)
 *   3. delivery is assigned to the authenticated Rider
 *   4. delivery is in a state that can legitimately be confirmed
 *      (OUT_FOR_DELIVERY only — the step immediately before DELIVERED)
 */
async function confirmDelivery(deliveryId, submittedTrackingCode, riderUser) {
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

  if (delivery.tracking_code !== submittedTrackingCode) {
    const err = new Error('Scanned code does not match this delivery.');
    err.status = 400;
    throw err;
  }

  if (delivery.assigned_rider_id !== riderUser.id) {
    const err = new Error('This delivery is not assigned to you.');
    err.status = 403;
    throw err;
  }

  if (delivery.status !== 'OUT_FOR_DELIVERY') {
    const err = new Error(
      `Cannot confirm a delivery with status ${delivery.status}. Delivery must be OUT_FOR_DELIVERY.`
    );
    err.status = 409;
    throw err;
  }

  const { data: updatedDelivery, error: updateError } = await supabase
    .from('deliveries')
    .update({
      status: 'DELIVERED',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (updateError || !updatedDelivery) {
    const err = new Error('Failed to confirm delivery.');
    err.status = 500;
    throw err;
  }

  await deliveryEventService.recordEvent({
    deliveryId,
    eventType: EVENT_TYPES.DELIVERED,
    performedBy: riderUser.id,
    metadata: null,
  });

  return updatedDelivery;
}

module.exports = { confirmDelivery };