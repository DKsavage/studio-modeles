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
    const errBody = await authRes.json().catch(() => ({}));
    /* Rate limit Supabase free tier (~4 emails/heure) */
    if (errBody.error_code === 'over_email_send_rate_limit') {
      return res.status(429).json({ success: false, message: 'Trop de tentatives. Réessaie dans quelques minutes.' });
    }
    return res.status(401).json({ success: false, message: 'Email non reconnu.' });
  }

  return res.status(200).json({ success: true });
};
