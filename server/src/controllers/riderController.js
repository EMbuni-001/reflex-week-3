const riderService = require('../services/riderService');

async function list(req, res, next) {
  try {
    const riders = await riderService.getAvailableRiders();
    return res.status(200).json({ riders });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };