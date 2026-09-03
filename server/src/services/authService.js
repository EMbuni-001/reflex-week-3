const supabase = require('../config/supabaseClient');

async function login(email, password) {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData?.session) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    const err = new Error('No profile found for this user.');
    err.status = 500;
    throw err;
  }

  return {
    access_token: authData.session.access_token,
    user: profile,
  };
}

module.exports = { login };