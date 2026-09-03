const supabase = require('../config/supabaseClient');

/**
 * Returns all users with the RIDER role.
 * "Available" per PROJECT_SPEC.md §6.3 has no defined availability/status
 * field in the schema, so this returns all riders — not filtered by
 * workload or active-delivery status, since that concept doesn't exist
 * in the current data model. Flagged to the team as an implementation
 * decision, not a spec requirement.
 */
async function getAvailableRiders() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone')
    .eq('role', 'RIDER')
    .order('name', { ascending: true });

  if (error) {
    const err = new Error('Failed to retrieve riders.');
    err.status = 500;
    throw err;
  }

  return data;
}

module.exports = { getAvailableRiders };