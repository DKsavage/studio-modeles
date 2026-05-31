'use strict';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  /* ── Auth Supabase ──────────────────────────────────────── */
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

  const { models, project, date, addressFr, addressEn, groups, notesFr, notesEn, unpaid, moodboard, whatsapp } = req.body;

  if (!models?.length || !project || !date || !addressFr) {
    return res.status(400).json({ success: false, message: 'Données manquantes.' });
  }

  const results = await Promise.allSettled(
    models.map(({ email, prenom }) => {
      const html = buildEmailHtml({ prenom, project, date, addressFr, addressEn, groups, notesFr, notesEn, unpaid, moodboard, whatsapp });
      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:     'Lumina Photography <casting@luminamodels.ca>',
          reply_to: 'luminaphotography.mtl@gmail.com',
          to:       [email],
          subject:  `${project} — Informations de session / Session details`,
          html,
        }),
      });
    })
  );

  const sent   = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return res.status(200).json({ success: true, sent, failed });
};

/* ── Construction de l'email HTML bilingual ────────────────── */
function buildEmailHtml({ prenom, project, date, addressFr, addressEn, groups, notesFr, notesEn, unpaid, moodboard, whatsapp }) {
  const addrEn = addressEn || addressFr;

  const groupRowsFr = (groups || [])
    .filter(g => g.name || g.time || g.members)
    .map(g => {
      const label = [g.name, g.members ? `(${g.members})` : ''].filter(Boolean).join(' ');
      return `<tr><td style="padding:3px 0;font-size:15px;color:#0a0a0a;line-height:1.7;">
        <strong>${esc(label)}</strong>${g.time ? ` &mdash; ${esc(g.time)}` : ''}
      </td></tr>`;
    }).join('');

  const groupRowsEn = (groups || [])
    .filter(g => g.name || g.time || g.members)
    .map(g => {
      const label = [g.name, g.members ? `(${g.members})` : ''].filter(Boolean).join(' ');
      const time  = g.time ? ` &mdash; ${esc(g.time)}` : '';
      return `<tr><td style="padding:3px 0;font-size:15px;color:#0a0a0a;line-height:1.7;">
        <strong>${esc(label)}</strong>${time}
      </td></tr>`;
    }).join('');

  const moodFr = moodboard ? '<p style="margin:16px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">Le moodboard est joint à ce courriel.</p>' : '';
  const moodEn = moodboard ? '<p style="margin:16px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">You will find the moodboard attached to this email.</p>' : '';

  const wappFr = whatsapp ? `<p style="margin:16px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">Nous avons créé un groupe WhatsApp pour faciliter la communication&nbsp;: <a href="${esc(whatsapp)}" style="color:#d4293a;">${esc(whatsapp)}</a></p>` : '';
  const wappEn = whatsapp ? `<p style="margin:16px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">We created a WhatsApp group to make communication easier&nbsp;: <a href="${esc(whatsapp)}" style="color:#d4293a;">${esc(whatsapp)}</a></p>` : '';

  const notesFrHtml = notesFr ? `<p style="margin:16px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">${esc(notesFr)}</p>` : '';
  const notesEnHtml = notesEn ? `<p style="margin:16px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">${esc(notesEn)}</p>` : '';

  const unpaidFr = unpaid ? '<p style="margin:16px 0 0;font-size:13px;color:#6b6b6b;line-height:1.7;">Veuillez noter que cette participation est non rémunérée. Un contrat d\'autorisation de droits à l\'image vous sera remis à l\'issue de la session.</p>' : '';
  const unpaidEn = unpaid ? '<p style="margin:16px 0 0;font-size:13px;color:#6b6b6b;line-height:1.7;">Please note that this participation is unpaid. An image rights release form will be provided following the session.</p>' : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f3f3;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Barre rouge signature -->
  <tr><td style="height:4px;background:#d4293a;"></td></tr>

  <!-- Logo -->
  <tr><td style="padding:28px 40px 20px;">
    <span style="font-family:Georgia,serif;font-size:20px;letter-spacing:0.12em;text-transform:uppercase;color:#d4293a;font-weight:700;">Lumina</span>
    <span style="font-family:Georgia,serif;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;font-weight:300;margin-left:6px;">Photography</span>
  </td></tr>

  <!-- Contenu FR -->
  <tr><td style="padding:0 40px 32px;">
    <p style="margin:0 0 16px;font-size:15px;color:#0a0a0a;line-height:1.7;">Bonsoir ${esc(prenom)},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#0a0a0a;line-height:1.7;">
      J'espère que vous allez bien.<br>
      Vous avez été sélectionné(e) pour participer au photoshoot <strong>${esc(project)}</strong>, qui se tiendra le <strong>${esc(date)}</strong>.
      Nous sommes ravis(es) de vous avoir à bord et vous remercions d'avance pour votre temps.
    </p>

    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6b6b;font-weight:600;">📍 Lieu</p>
    <p style="margin:0 0 24px;font-size:15px;color:#0a0a0a;line-height:1.7;">${esc(addressFr)}</p>

    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6b6b;font-weight:600;">🕐 Heure de call time</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${groupRowsFr}</table>

    ${moodFr}
    ${notesFrHtml}
    ${wappFr}
    <p style="margin:24px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">Merci de répondre à ce courriel pour confirmer votre présence.</p>
    ${unpaidFr}
    <p style="margin:20px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">Au plaisir de vous retrouver&nbsp;!</p>
  </td></tr>

  <!-- Séparateur -->
  <tr><td style="padding:0 40px;"><div style="height:1px;background:#e2e2e2;"></div></td></tr>

  <!-- Contenu EN -->
  <tr><td style="padding:32px 40px;">
    <p style="margin:0 0 16px;font-size:15px;color:#0a0a0a;line-height:1.7;">Hi ${esc(prenom)},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#0a0a0a;line-height:1.7;">
      I hope you're doing well.<br>
      You have been selected to participate in the <strong>${esc(project)}</strong> photoshoot, taking place on <strong>${esc(date)}</strong>.
      We're so excited to have you and thank you in advance for your time!
    </p>

    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6b6b;font-weight:600;">📍 Location</p>
    <p style="margin:0 0 24px;font-size:15px;color:#0a0a0a;line-height:1.7;">${esc(addrEn)}</p>

    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6b6b;font-weight:600;">🕐 Call times</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${groupRowsEn}</table>

    ${moodEn}
    ${notesEnHtml}
    ${wappEn}
    <p style="margin:24px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">Please reply to this email to confirm your availability.</p>
    ${unpaidEn}
    <p style="margin:20px 0 0;font-size:15px;color:#0a0a0a;line-height:1.7;">Looking forward to seeing you!</p>
  </td></tr>

  <!-- Signature -->
  <tr><td style="padding:0 40px 32px;">
    <div style="border-top:1px solid #e2e2e2;padding-top:18px;margin-top:4px;">
      <div style="margin-bottom:4px;">
        <span style="font-family:Georgia,serif;font-size:16px;letter-spacing:0.1em;text-transform:uppercase;color:#d4293a;font-weight:700;">Lumina</span>
        <span style="font-family:Georgia,serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#0a0a0a;font-weight:300;margin-left:4px;">Photography</span>
      </div>
      <div style="font-size:12px;color:#6b6b6b;line-height:1.7;">
        casting@luminamodels.ca<br>
        luminamodels.ca &nbsp;·&nbsp; Montréal
      </div>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
