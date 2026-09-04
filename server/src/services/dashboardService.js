const deliveryService = require('./deliveryService');

const STATUS_LIST = [
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

/**
 * Role-scoped dashboard summary. Reuses getDeliveries' exact scoping
 * logic so dashboard counts always match what the delivery list view
 * shows for the same user — no separate, potentially inconsistent
 * query logic (PROJECT_SPEC.md §10.4 gives purpose only, no fields;
 * this shape is an implementation decision, documented for the team).
 */
async function getDashboardSummary(user) {
  const deliveries = await deliveryService.getDeliveries(user);

  const counts = STATUS_LIST.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  for (const delivery of deliveries) {
    counts[delivery.status] = (counts[delivery.status] || 0) + 1;
  }

  return {
    role: user.role,
    total: deliveries.length,
    counts,
  };
}

module.exports = { getDashboardSummary };