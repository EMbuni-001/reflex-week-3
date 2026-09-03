const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

// TEMPORARY — for verifying auth/authorization middleware only.
// Not part of the PROJECT_SPEC.md API surface; remove once
// real protected routes exist to test against.
router.get(
  '/',
  authenticate,
  authorize(['RETAILER_STAFF', 'DISPATCHER', 'RIDER']),
  (req, res) => {
    res.status(200).json({ user: req.user });
  }
);

module.exports = router;