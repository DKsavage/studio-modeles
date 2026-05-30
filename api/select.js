'use strict';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  /* ── Auth — même vérification que api/candidatures.js ── */
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Non autorisé.' });
  }
  const accessToken = authHeader.split(' ')[1];
  const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey':        process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!userRes.ok) {
    return res.status(401).json({ success: false, message: 'Session expirée. Reconnecte-toi.' });
  }

  const { email, prenom, nom } = req.body;
  if (!email || !prenom) {
    return res.status(400).json({ success: false, message: 'Données manquantes.' });
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:     'Lumina Photography <casting@luminamodels.ca>',
      reply_to: 'luminaphotography.mtl@gmail.com',
      to:       [email],
      subject:  'Félicitations — Tu as été sélectionné(e) par Lumina Photography',
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #0a0a0a;">
          <h1 style="font-weight: 300; font-size: 2rem; margin-bottom: 8px;">Lumina Photography</h1>
          <p style="color: #6b6b6b; margin-bottom: 32px;">Agence de mannequinat</p>
          <p>Bonjour <strong>${prenom}</strong>,</p>
          <p>Nous avons le plaisir de t'informer que ton profil a été <strong>sélectionné</strong> pour un projet Lumina Photography.</p>
          <p>Un membre de notre équipe te contactera très prochainement pour te donner tous les détails.</p>
          <p style="color: #6b6b6b; font-size: 0.9rem; margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px;">L'équipe Lumina Photography<br/>casting@luminamodels.ca</p>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error('Resend error:', err);
    return res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'email." });
  }

  return res.status(200).json({ success: true });
};
