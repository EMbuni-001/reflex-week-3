const supabase = require('../config/supabaseClient');

async function registerRetailer({ email, password, name, phone }) {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    const err = new Error(
      authError?.message?.toLowerCase().includes('already')
        ? 'An account with this email already exists.'
        : 'Unable to create account.'
    );
    err.status = authError?.message?.toLowerCase().includes('already') ? 409 : 400;
    throw err;
  }

  const userId = authData.user.id;
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: userId,
      name,
      email,
      phone,
      role: 'RETAILER_STAFF',
    })
    .select('id, name, email, role')
    .single();

  if (profileError || !profile) {
    await supabase.auth.admin.deleteUser(userId);
    const err = new Error('Unable to finish account setup.');
    err.status = 500;
    throw err;
  }

  return { user: profile };
}

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

module.exports = { login, registerRetailer };