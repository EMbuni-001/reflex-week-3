const dashboardService = require('../services/dashboardService');

async function get(req, res, next) {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user);
    return res.status(200).json({ dashboard: summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { get };