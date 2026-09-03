const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../validators/validate');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

router.get('/', authenticate, deliveryController.list);

router.get('/:id', authenticate, deliveryController.getById);

router.get('/:id/events', authenticate, deliveryController.getEvents);

router.post(
  '/',
  authenticate,
  authorize(['RETAILER_STAFF']),
  validate({
    customer_name: { required: true, type: 'string' },
    customer_phone: { required: true, type: 'string' },
    address: { required: true, type: 'string' },
    item_description: { required: true, type: 'string' },
  }),
  deliveryController.create
);

router.patch('/:id/assign', authenticate, authorize(['DISPATCHER']), deliveryController.assign);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['RIDER', 'DISPATCHER']),
  deliveryController.updateStatus
);

// POST /api/deliveries/:id/confirm — PROJECT_SPEC.md §6.6, §16
router.post('/:id/confirm', authenticate, authorize(['RIDER']), deliveryController.confirm);

module.exports = router;