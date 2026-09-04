const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../validators/validate');

const router = express.Router();

// POST /api/auth/login — PROJECT_SPEC.md §10.1
router.post('/login', authController.login);

router.post(
	'/register',
	validate({
		email: { required: true, type: 'string' },
		password: { required: true, type: 'string' },
		name: { required: true, type: 'string' },
		phone: { required: true, type: 'string' },
	}),
	authController.register
);

module.exports = router;