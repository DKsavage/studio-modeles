'use strict';

/* Vérifie le code OTP saisi et retourne un access_token si valide */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, token } = req.body;
  if (!email || !token) {
    return res.status(400).json({ success: false, message: 'Email et code requis.' });
  }

  const authRes = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/verify`,
    {
      method: 'POST',
      headers: {
        'apikey':       process.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'email', email, token }),
    }
  );

  if (!authRes.ok) {
    return res.status(401).json({ success: false, message: 'Code invalide ou expiré.' });
  }

  const { access_token } = await authRes.json();
  return res.status(200).json({ success: true, token: access_token });
};
