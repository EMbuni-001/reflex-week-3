const express = require('express');
const authenticate = require('../middleware/authenticate');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard — PROJECT_SPEC.md §10.4 (role-scoped summary)
router.get('/', authenticate, dashboardController.get);

module.exports = router;