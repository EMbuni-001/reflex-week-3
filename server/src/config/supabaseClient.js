const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.'
  );
}

// Uses the service-role key: this client runs only on the backend
// and must never be sent to or used in frontend code (PROJECT_SPEC.md §14).
//
// `realtime.transport: ws` works around Node 20 not having a native
// WebSocket implementation, which @supabase/supabase-js needs internally
// even when we're only using auth/database features right now.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  realtime: {
    transport: ws,
  },
});

module.exports = supabase;