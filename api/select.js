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
      html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f3f3;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="height:4px;background:#d4293a;"></td></tr>
  <tr><td style="padding:28px 40px 0;">
    <span style="font-family:Georgia,serif;font-size:20px;letter-spacing:0.12em;text-transform:uppercase;color:#d4293a;font-weight:700;">Lumina</span>
    <span style="font-family:Georgia,serif;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;font-weight:300;margin-left:6px;">Photography</span>
  </td></tr>
  <tr><td style="padding:24px 40px 32px;">
    <p style="margin:0 0 14px;font-size:15px;color:#0a0a0a;line-height:1.7;">Bonjour <strong>${prenom}</strong>,</p>
    <p style="margin:0 0 14px;font-size:15px;color:#0a0a0a;line-height:1.7;">Nous avons le plaisir de t'informer que ton profil a été <strong>sélectionné</strong> pour un projet Lumina Photography.</p>
    <p style="margin:0 0 14px;font-size:15px;color:#0a0a0a;line-height:1.7;">Tu recevras très prochainement tous les détails concernant la session (date, lieu, heure de call time).</p>
    <p style="margin:0 0 32px;font-size:15px;color:#0a0a0a;line-height:1.7;"><strong>Merci de répondre à cet email pour confirmer ta disponibilité.</strong></p>
    <hr style="border:none;border-top:1px solid #e2e2e2;margin:0 0 20px;">
    <p style="margin:0 0 14px;font-size:15px;color:#0a0a0a;line-height:1.7;">Hi <strong>${prenom}</strong>,</p>
    <p style="margin:0 0 14px;font-size:15px;color:#0a0a0a;line-height:1.7;">We're pleased to let you know that your profile has been <strong>selected</strong> for a Lumina Photography project.</p>
    <p style="margin:0 0 14px;font-size:15px;color:#0a0a0a;line-height:1.7;">You will receive all the details about the session (date, location, call time) very soon.</p>
    <p style="margin:0 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;"><strong>Please reply to this email to confirm your availability.</strong></p>
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <div style="border-top:1px solid #e2e2e2;padding-top:16px;">
      <span style="font-family:Georgia,serif;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;color:#d4293a;font-weight:700;">Lumina</span>
      <span style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#0a0a0a;font-weight:300;margin-left:4px;">Photography</span>
      <div style="font-size:12px;color:#6b6b6b;margin-top:4px;">casting@luminamodels.ca &nbsp;·&nbsp; luminamodels.ca</div>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error('Resend error:', err);
    return res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'email." });
  }

  return res.status(200).json({ success: true });
};
