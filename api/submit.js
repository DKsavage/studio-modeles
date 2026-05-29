'use strict';

/*
  VERCEL FUNCTION — api/submit.js
  ─────────────────────────────────────────────────────────────
  Vercel détecte ce fichier automatiquement.
  POST /api/submit → cette fonction s'exécute côté serveur.

  Différence avec Apps Script :
  - Apps Script : déployé chez Google, URL externe stable
  - Vercel Function : déployé dans le MÊME projet que le frontend,
    même domaine → pas de CORS, pas de Content-Type hack.
*/

/* Taille max acceptée par photo (1,5 Mo en octets) */
const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

/* Durée minimale en ms entre deux soumissions par IP */
const RATE_LIMIT_MS = 60_000;

/*
  RATE LIMIT en mémoire
  En production réelle, on utiliserait Redis ou Upstash.
  Ici : Map JS en mémoire — suffit pour commencer.
  Limite : réinitialisée à chaque redéploiement (acceptable en dev).
*/
const lastSubmitByIp = new Map();

function base64ToBuffer(base64Data){
  const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
  const base64Pure = matches[2];
  return Buffer.from(base64Pure, 'base64');
}

async function uploadPhoto(buffer, fileName, supabaseUrl, supabaseKey) {
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/photos-candidatures/${fileName}`,
      {
        method: 'POST',
        headers: {
          'apikey':        supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type':  'image/jpeg',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Upload photo: ${uploadRes.status} — ${err}`);
    }

    return `photos-candidatures/${fileName}`;
}

async function sendConfirmationEmails(data) {
    const resendKey = process.env.RESEND_API_KEY;

    /* Email à la candidate */
    const toCandidate = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Lumina Photography <casting@luminamodels.ca>',
        to:      [data.email],
        subject: 'Inscription reçue — Lumina Photography',
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #0a0a0a;">
            <h1 style="font-weight: 300; font-size: 2rem; margin-bottom: 8px;">Lumina Photography</h1>
            <p style="color: #6b6b6b; margin-bottom: 32px;">Agence de mannequinat</p>
            <p>Bonjour <strong>${data.prenom}</strong>,</p>
            <p>Tu as bien été enregistré(e) dans notre base de modèles. Nous te contacterons dès qu'un projet correspondant à ton profil se présente.</p>
            <p style="color: #6b6b6b; font-size: 0.9rem; margin-top: 32px;">L'équipe Lumina Photography</p>
          </div>
        `,
      }),
    });

    /* Notification à l'admin */
    const toAdmin = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Lumina Photography <casting@luminamodels.ca>',
        to:      ['bitoungui32@gmail.com'],
        subject: `Nouveau modèle inscrit — ${data.prenom} ${data.nom}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #0a0a0a;">
            <h2 style="font-weight: 300;">Nouveau modèle inscrit</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
              <tr><td style="padding: 8px 0; 
  color:#6b6b6b;">Nom</td><td><strong>${data.prenom} ${data.nom}</strong></td></tr>
              <tr><td style="padding: 8px 0; 
  color:#6b6b6b;">Email</td><td>${data.email}</td></tr>
              <tr><td style="padding: 8px 0; 
  color:#6b6b6b;">Téléphone</td><td>${data.telephone}</td></tr>
              <tr><td style="padding: 8px 0; 
  color:#6b6b6b;">Genre</td><td>${data.genre}</td></tr>
              <tr><td style="padding: 8px 0; 
  color:#6b6b6b;">Taille</td><td>${data.taille} cm</td></tr>
              <tr><td style="padding: 8px 0; 
  color:#6b6b6b;">Expérience</td><td>${data.experience}</td></tr>
            </table>
            <p style="margin-top: 24px;"><a href="https://luminamodels.ca/admin.html" 
  style="background:#0a0a0a; color:#fff; padding: 12px 24px; text-decoration: none; 
  font-size: 0.8rem; letter-spacing: 0.1em;">Voir le dashboard →</a></p>
          </div>
        `,
      }),
    });

    /* Envoie les deux en parallèle */
    await Promise.all([toCandidate, toAdmin]);
}

/*
  export default
  Syntaxe Vercel pour déclarer le handler de la route.
  req = requête entrante (body, headers, méthode)
  res = réponse à envoyer (status, json, etc.)
*/
module.exports = async function handler(req, res) {

  /* Seul POST est accepté */
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée.' });
  }

  const data = req.body;

  /* ── 1. HONEYPOT ────────────────────────────────────────────
     Champ "website" invisible pour les humains.
     Si rempli → bot → on abandonne silencieusement.
  ──────────────────────────────────────────────────────────── */
  if (data.website) {
    /* On répond "succès" pour ne pas révéler le piège au bot */
    return res.status(200).json({ success: true });
  }

  /* ── 2. RATE LIMIT ──────────────────────────────────────────
     On identifie l'IP via les headers Vercel.
     x-forwarded-for = IP réelle derrière le proxy Vercel.
  ──────────────────────────────────────────────────────────── */
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const lastTime = lastSubmitByIp.get(ip) || 0;

  if (now - lastTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastTime)) / 1000);
    return res.status(429).json({
      success: false,
      message: `Merci de patienter encore ${waitSec} secondes avant de soumettre.`
    });
  }

  lastSubmitByIp.set(ip, now);

  /* ── 3. RECAPTCHA v3 ────────────────────────────────────────
     On vérifie le token auprès de l'API Google.
     La clé SECRÈTE ne doit JAMAIS être dans le frontend —
     c'est pour ça qu'on la met ici, côté serveur.
  ──────────────────────────────────────────────────────────── */
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${data.recaptchaToken}`;

  const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
  const recaptchaJson = await recaptchaRes.json();

  /*
    score reCAPTCHA v3
    0.0 = très probablement un bot
    1.0 = très probablement un humain
    Seuil 0.5 = compromis standard en production
  */
  if (!recaptchaJson.success || recaptchaJson.score < 0.5) {
    return res.status(403).json({
      success: false,
      message: 'Vérification anti-bot échouée. Réessaie dans quelques instants.'
    });
  }

  /* ── 4. VALIDATION TAILLE PHOTOS ────────────────────────────
     On calcule la vraie taille à partir du base64.
     Formule : (longueur × 3) / 4 - padding
     padding = nombre de '=' à la fin du base64
  ──────────────────────────────────────────────────────────── */
  function getBase64Size(base64Data) {
    const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) throw new Error('Format de photo invalide.');
    const base64Pure = matches[2];
    const padding = (base64Pure.match(/=+$/) || [''])[0].length;
    return Math.floor((base64Pure.length * 3) / 4) - padding;
  }

  try {
    const profilSize = getBase64Size(data.photoProfil);
    const bodySize   = getBase64Size(data.photoBody);

    if (profilSize > MAX_PHOTO_BYTES || bodySize > MAX_PHOTO_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'Une photo dépasse la limite de 1,5 Mo. Essaie de la compresser avant d\'envoyer.'
      });
    }
  } catch {
    return res.status(400).json({ success: false, message: 'Format de photo invalide.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  /* Génère un nom de fichier unique : email + timestamp */
  const timestamp = Date.now();
  const baseName = data.email.replace(/[@.]/g, '_') + '_' + timestamp;

  /* Convertit base64 → Buffer et upload les 2 photos */
  const profilBuffer = base64ToBuffer(data.photoProfil);
  const bodyBuffer   = base64ToBuffer(data.photoBody);

  const profilPath = await uploadPhoto(profilBuffer, `${baseName}_profil.jpg`,
  supabaseUrl, supabaseKey);
  const bodyPath   = await uploadPhoto(bodyBuffer,   `${baseName}_body.jpg`,
  supabaseUrl, supabaseKey);

  const supabaseRes = await fetch(`${supabaseUrl}/rest/v1/candidatures`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      prenom:       data.prenom,
      nom:          data.nom,
      email:        data.email,
      telephone:    data.telephone,
      instagram:    data.instagram    || null,
      taille:       data.taille       ? parseInt(data.taille)    : null,
      genre:        data.genre        || null,
      poitrine:     data.poitrine     ? parseInt(data.poitrine)  : null,
      tour_taille:  data.tourTaille   ? parseInt(data.tourTaille): null,
      hanches:      data.hanches      ? parseInt(data.hanches)   : null,
      pointure:     data.pointure     ? parseInt(data.pointure)  : null,
      taille_haut:  data.tailleHaut   || null,
      taille_bas:   data.tailleBas    || null,
      experience:   data.experience   || null,
      disponibilite:data.disponibilite|| null,
      photo_profil_url: profilPath,
      photo_body_url:   bodyPath,
    })
  });

  if (!supabaseRes.ok) {
    const errText = await supabaseRes.text();
    throw new Error(`Supabase: ${supabaseRes.status} — ${errText}`);
  }
  
  /* Emails de confirmation — non bloquant */
  sendConfirmationEmails(data).catch(err => console.error('Email error:', err));

  return res.status(200).json({ success: true });
}

/*
  CONFIG VERCEL — bodyParser
  Par défaut, Vercel limite le body à 1 Mo.
  On monte à 10 Mo pour accepter 2 photos base64 (~2 Mo chacune en JPEG compressé).
*/
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
