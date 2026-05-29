'use strict';

/* Connexion email + mot de passe classique */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
  }

  const authRes = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'apikey':       process.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!authRes.ok) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
  }

  const { access_token } = await authRes.json();
  return res.status(200).json({ success: true, token: access_token });
};
