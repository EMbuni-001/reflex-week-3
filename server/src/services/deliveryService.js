const supabase = require('../config/supabaseClient');
const deliveryEventService = require('./deliveryEventService');
const { EVENT_TYPES } = deliveryEventService;

function generateTrackingCode() {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RFX-${timestampPart}-${randomPart}`;
}

async function createDelivery(fields, createdByUserId) {
  const trackingCode = generateTrackingCode();

  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .insert({
      tracking_code: trackingCode,
      customer_name: fields.customer_name,
      customer_phone: fields.customer_phone,
      address: fields.address,
      item_description: fields.item_description,
      status: 'PENDING',
      created_by: createdByUserId,
    })
    .select()
    .single();

  if (deliveryError || !delivery) {
    const err = new Error('Failed to create delivery.');
    err.status = 500;
    throw err;
  }

  await deliveryEventService.recordEvent({
    deliveryId: delivery.id,
    eventType: EVENT_TYPES.CREATED,
    performedBy: createdByUserId,
  });

  return delivery;
}

async function getDeliveries(user) {
  let query = supabase.from('deliveries').select('*').order('created_at', { ascending: false });

  if (user.role === 'RETAILER_STAFF') {
    query = query.eq('created_by', user.id);
  } else if (user.role === 'RIDER') {
    query = query.eq('assigned_rider_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    const err = new Error('Failed to retrieve deliveries.');
    err.status = 500;
    throw err;
  }

  return data;
}

async function getDeliveryById(id, user) {
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !delivery) {
    return null;
  }

  if (user.role === 'RETAILER_STAFF' && delivery.created_by !== user.id) {
    return null;
  }

  if (user.role === 'RIDER' && delivery.assigned_rider_id !== user.id) {
    return null;
  }

  return delivery;
}

async function assignDelivery(deliveryId, riderId, dispatcherUserId) {
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

  if (delivery.status !== 'PENDING' && delivery.status !== 'ASSIGNED') {
    const err = new Error(
      `Cannot assign a delivery with status ${delivery.status}. Only PENDING or ASSIGNED deliveries can be assigned or reassigned.`
    );
    err.status = 409;
    throw err;
  }

  const { data: rider, error: riderError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', riderId)
    .single();

  if (riderError || !rider || rider.role !== 'RIDER') {
    const err = new Error('rider_id must belong to a user with role RIDER.');
    err.status = 400;
    throw err;
  }

  const { data: updatedDelivery, error: updateError } = await supabase
    .from('deliveries')
    .update({
      assigned_rider_id: riderId,
      status: 'ASSIGNED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (updateError || !updatedDelivery) {
    const err = new Error('Failed to assign delivery.');
    err.status = 500;
    throw err;
  }

  await deliveryEventService.recordEvent({
    deliveryId,
    eventType: EVENT_TYPES.ASSIGNED,
    performedBy: dispatcherUserId,
    metadata: { rider_id: riderId },
  });

  return updatedDelivery;
}

/**
 * Returns ordered (oldest -> newest) events for a delivery, respecting
 * the same role-based scoping as getDeliveryById — if the caller
 * cannot see the delivery, they cannot see its events either.
 * Returns null if the delivery doesn't exist or is out of scope.
 */
async function getDeliveryEvents(id, user) {
  const delivery = await getDeliveryById(id, user);

  if (!delivery) {
    return null;
  }

  const { data, error } = await supabase
    .from('delivery_events')
    .select('*')
    .eq('delivery_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    const err = new Error('Failed to retrieve delivery events.');
    err.status = 500;
    throw err;
  }

  return data;
}

module.exports = {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  assignDelivery,
  getDeliveryEvents,
};