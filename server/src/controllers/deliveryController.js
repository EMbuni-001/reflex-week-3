const deliveryService = require('../services/deliveryService');
const deliveryStatusService = require('../services/deliveryStatusService');
const deliveryConfirmationService = require('../services/deliveryConfirmationService');

async function create(req, res, next) {
  try {
    const { customer_name, customer_phone, address, item_description } = req.body;

    const delivery = await deliveryService.createDelivery(
      { customer_name, customer_phone, address, item_description },
      req.user.id
    );

    return res.status(201).json({ delivery });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const deliveries = await deliveryService.getDeliveries(req.user);
    return res.status(200).json({ deliveries });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id, req.user);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found.' });
    }

    return res.status(200).json({ delivery });
  } catch (err) {
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    const { rider_id } = req.body;

    if (!rider_id) {
      return res.status(400).json({ error: 'Validation failed.', details: ['rider_id is required'] });
    }

    const delivery = await deliveryService.assignDelivery(req.params.id, rider_id, req.user.id);
    return res.status(200).json({ delivery });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Validation failed.', details: ['status is required'] });
    }

    const delivery = await deliveryStatusService.updateDeliveryStatus(req.params.id, status, req.user);
    return res.status(200).json({ delivery });
  } catch (err) {
    next(err);
  }
}

async function getEvents(req, res, next) {
  try {
    const events = await deliveryService.getDeliveryEvents(req.params.id, req.user);

    if (!events) {
      return res.status(404).json({ error: 'Delivery not found.' });
    }

    return res.status(200).json({ events });
  } catch (err) {
    next(err);
  }
}

async function confirm(req, res, next) {
  try {
    const { tracking_code } = req.body;

    if (!tracking_code) {
      return res.status(400).json({ error: 'Validation failed.', details: ['tracking_code is required'] });
    }

    const delivery = await deliveryConfirmationService.confirmDelivery(
      req.params.id,
      tracking_code,
      req.user
    );

    return res.status(200).json({ delivery });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, assign, updateStatus, getEvents, confirm };