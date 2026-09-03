const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const riderController = require('../controllers/riderController');

const router = express.Router();

// GET /api/riders — PROJECT_SPEC.md §6.3, §10.3
router.get('/', authenticate, authorize(['DISPATCHER']), riderController.list);

module.exports = router;