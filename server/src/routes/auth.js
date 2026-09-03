const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login — PROJECT_SPEC.md §10.1
router.post('/login', authController.login);

module.exports = router;