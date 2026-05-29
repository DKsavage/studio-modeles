'use strict';

/* Envoie un code OTP à 6 chiffres par email via Supabase Auth */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email requis.' });

  const authRes = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/otp`,
    {
      method: 'POST',
      headers: {
        'apikey':       process.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      /* createUser: false → seuls les admins existants peuvent recevoir un code */
      body: JSON.stringify({ email, createUser: false }),
    }
  );

  if (!authRes.ok) {
    const errBody = await authRes.text();
    console.error('Supabase OTP error:', authRes.status, errBody);
    return res.status(401).json({ success: false, message: 'Email non reconnu.', debug: errBody });
  }

  return res.status(200).json({ success: true });
};
