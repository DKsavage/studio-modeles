'use strict';


/* ─────────────────────────────────────────────────────────────
   📘 CONFIGURATION — URL de l'API Apps Script
   C'est l'URL obtenue après le déploiement Apps Script.
   Si un jour tu redéploies, remplace cette URL ici.
───────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIQjLe30ejdfzfBnMTsPBlsLvhikabrv2_EgJNkElJXReAjko6cng_t77pCXNS2PK3/exec';
const RECAPTCHA_SITE_KEY = '6LddUeAsAAAAAO4fcgYselTJy8a0EBen0SoPookQ';


const form       = document.getElementById('modelForm');
const submitBtn  = document.getElementById('submitBtn');
const successMsg = document.getElementById('successMessage');


function showError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) error.classList.add('visible');
}

function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) error.classList.remove('visible');
}


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function formatInstagramUrl(input) {
  let pseudo = input.trim();
  if (!pseudo) return '';

  pseudo = pseudo.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');

  if (pseudo.startsWith('@')) pseudo = pseudo.substring(1);
  if (pseudo.endsWith('/')) pseudo = pseudo.slice(0, -1);

  if (!pseudo) return '';
  return `https://instagram.com/${pseudo}`;
}


function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}


function setupUpload(inputId, previewId, zoneId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const zone    = document.getElementById(zoneId);

  input.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      zone.classList.add('has-photo');
      zone.querySelector('.upload-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

setupUpload('photoProfil', 'previewProfil', 'zoneProfil');
setupUpload('photoBody',   'previewBody',   'zoneBody');


function validateForm() {
  let isValid = true;

  const prenom = document.getElementById('prenom').value.trim();
  if (!prenom) { showError('prenom', 'prenomError'); isValid = false; }
  else { clearError('prenom', 'prenomError'); }

  const nom = document.getElementById('nom').value.trim();
  if (!nom) { showError('nom', 'nomError'); isValid = false; }
  else { clearError('nom', 'nomError'); }

  const email = document.getElementById('email').value.trim();
  if (!email || !isValidEmail(email)) { showError('email', 'emailError'); isValid = false; }
  else { clearError('email', 'emailError'); }

  const telephone = document.getElementById('telephone').value.trim();
  if (!telephone) { showError('telephone', 'telephoneError'); isValid = false; }
  else { clearError('telephone', 'telephoneError'); }

  const taille = Number(document.getElementById('taille').value);
  if (!taille || taille < 140 || taille > 220) { showError('taille', 'tailleError'); isValid = false; }
  else { clearError('taille', 'tailleError'); }

  if (!document.getElementById('photoProfil').files[0]) {
    document.getElementById('profilError').classList.add('visible'); isValid = false;
  } else { document.getElementById('profilError').classList.remove('visible'); }

  if (!document.getElementById('photoBody').files[0]) {
    document.getElementById('bodyError').classList.add('visible'); isValid = false;
  } else { document.getElementById('bodyError').classList.remove('visible'); }

  if (!document.querySelector('input[name="genre"]:checked')) {
    document.getElementById('genreError').classList.add('visible'); isValid = false;
  } else { document.getElementById('genreError').classList.remove('visible'); }

  if (!document.querySelector('input[name="tailleHaut"]:checked')) {
    document.getElementById('tailleHautError').classList.add('visible'); isValid = false;
  } else { document.getElementById('tailleHautError').classList.remove('visible'); }

  if (!document.querySelector('input[name="tailleBas"]:checked')) {
    document.getElementById('tailleBasError').classList.add('visible'); isValid = false;
  } else { document.getElementById('tailleBasError').classList.remove('visible'); }

  if (!document.getElementById('experience').value) {
    showError('experience', 'experienceError'); isValid = false;
  } else { clearError('experience', 'experienceError'); }

  return isValid;
}


function collectFormData() {
  return {
    website:       document.getElementById('website').value,
    prenom:        document.getElementById('prenom').value.trim(),
    nom:           document.getElementById('nom').value.trim(),
    email:         document.getElementById('email').value.trim(),
    telephone:     document.getElementById('telephone').value.trim(),
    instagram:     formatInstagramUrl(document.getElementById('instagram').value),
    taille:        document.getElementById('taille').value,
    genre:         (document.querySelector('input[name="genre"]:checked') || {}).value || '',
    poitrine:      document.getElementById('poitrine').value,
    tourTaille:    document.getElementById('tourTaille').value,
    hanches:       document.getElementById('hanches').value,
    pointure:      document.getElementById('pointure').value,
    tailleHaut:    (document.querySelector('input[name="tailleHaut"]:checked') || {}).value || '',
    tailleBas:     (document.querySelector('input[name="tailleBas"]:checked') || {}).value || '',
    experience:    document.getElementById('experience').value,
    disponibilite: document.getElementById('disponibilite').value,
    dateInscription: new Date().toLocaleDateString('fr-FR'),
  };
}


form.addEventListener('submit', async function(event) {
  event.preventDefault();

  if (!validateForm()) {
    const firstError = document.querySelector('.error, .field-error.visible');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';

  try {
    /* Génération du token reCAPTCHA */
    const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {
      action: 'submit'
    });

    /* DEBUG : on logge la longueur du token pour vérifier qu'il existe bien */
    console.log('🔑 Token reCAPTCHA généré, longueur :', recaptchaToken.length);
    console.log('🔑 Début du token :', recaptchaToken.substring(0, 30) + '...');

    /* Conversion des 2 photos en base64 */
    const photoProfilFile = document.getElementById('photoProfil').files[0];
    const photoBodyFile   = document.getElementById('photoBody').files[0];

    const photoProfilBase64 = await fileToBase64(photoProfilFile);
    const photoBodyBase64   = await fileToBase64(photoBodyFile);

    const data = {
      ...collectFormData(),
      photoProfil:    photoProfilBase64,
      photoBody:      photoBodyBase64,
      recaptchaToken: recaptchaToken
    };

    /* DEBUG : on logge la valeur du honeypot pour la traçabilité */
    console.log('🍯 Valeur du champ honeypot envoyé :', JSON.stringify(data.website));

    console.log('📦 Envoi vers Apps Script…');

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    const result = await response.json();

    /* 🔍 DEBUG : on affiche le RAPPORT COMPLET reçu du serveur
       L'objet _debug contient toutes les étapes franchies côté serveur. */
    console.log('✅ Réponse du serveur :', result);
    console.log('🔍 ===== RAPPORT DEBUG SERVEUR =====');
    console.log('🔍 Version du code serveur :', result._debug && result._debug.version);
    console.log('🔍 Étape atteinte :', result._debug && result._debug.step);
    console.log('🔍 Champs reçus :', result._debug && result._debug.fields);
    if (result._debug && result._debug.recaptcha) {
      console.log('🔍 reCAPTCHA détails :', result._debug.recaptcha);
    }
    console.log('🔍 Debug complet :', result._debug);
    console.log('🔍 ===================================');

    if (!result.success) {
      throw new Error(result.message || 'Erreur inconnue');
    }

    /* Avertit si le message est le faux succès (bot/recaptcha rejet) */
    if (result.message === 'Candidature enregistrée' && !result.message.includes('succès')) {
      console.warn('⚠️ Message faux-succès reçu — la candidature n\'a probablement PAS été enregistrée');
      console.warn('⚠️ Regarde l\'étape atteinte ci-dessus pour comprendre où ça a bloqué');
    }

    form.style.display = 'none';
    successMsg.classList.add('visible');
    successMsg.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi :', err);
    alert('Une erreur est survenue. Vérifie ta connexion et réessaie.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Envoyer ma candidature';
  }
});


/* Validation en temps réel */
['prenom', 'nom', 'email', 'telephone', 'taille'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener('input', () => {
    if (el.value.trim()) clearError(id, id + 'Error');
  });
});