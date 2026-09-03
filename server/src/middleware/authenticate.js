const supabase = require('../config/supabaseClient');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  const { data: tokenData, error: tokenError } = await supabase.auth.getUser(token);

  if (tokenError || !tokenData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const userId = tokenData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: 'No profile found for this user.' });
  }

  req.user = profile;
  next();
}

module.exports = authenticate;