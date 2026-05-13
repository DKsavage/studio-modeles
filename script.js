'use strict';

/* ═══════════════════════════════════════════════════════════════
   LUMINA PHOTOGRAPHY — Frontend
   Version : 1.0
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   CONFIGURATION
   APPS_SCRIPT_URL    : URL de l'API Apps Script (déploiement Web App)
   RECAPTCHA_SITE_KEY : Clé publique reCAPTCHA v3 (liée au domaine)
───────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxEq1l0jcBTKhkXdKCBOY339su5BPlhnaf5Hzr706uO6XOe4NxDrZy4N4KQxXc5A5ei/exec';
const RECAPTCHA_SITE_KEY = '6LddUeAsAAAAAO4fcgYselTJy8a0EBen0SoPookQ';


const form       = document.getElementById('modelForm');
const submitBtn  = document.getElementById('submitBtn');
const successMsg = document.getElementById('successMessage');


/* ─────────────────────────────────────────────────────────────
   GESTION DES ERREURS
───────────────────────────────────────────────────────────── */

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


/* ─────────────────────────────────────────────────────────────
   VALIDATION & FORMATAGE
───────────────────────────────────────────────────────────── */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalise l'entrée Instagram en URL propre.
 * Accepte : @user, user, instagram.com/user, https://www.instagram.com/user/
 * Retourne : https://instagram.com/user
 */
function formatInstagramUrl(input) {
  let pseudo = input.trim();
  if (!pseudo) return '';

  pseudo = pseudo.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');

  if (pseudo.startsWith('@')) pseudo = pseudo.substring(1);
  if (pseudo.endsWith('/')) pseudo = pseudo.slice(0, -1);

  if (!pseudo) return '';
  return `https://instagram.com/${pseudo}`;
}


/* ─────────────────────────────────────────────────────────────
   GESTION DES PHOTOS (upload + aperçu + conversion base64)
───────────────────────────────────────────────────────────── */

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


/* ─────────────────────────────────────────────────────────────
   VALIDATION DU FORMULAIRE
   Retourne true si tous les champs obligatoires sont valides.
───────────────────────────────────────────────────────────── */

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


/* ─────────────────────────────────────────────────────────────
   COLLECTE DES DONNÉES
───────────────────────────────────────────────────────────── */

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


/* ─────────────────────────────────────────────────────────────
   SOUMISSION DU FORMULAIRE
   1. Validation
   2. Génération token reCAPTCHA
   3. Conversion photos en base64
   4. Envoi vers Apps Script
───────────────────────────────────────────────────────────── */

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
    /* 🛡️ Génération du token reCAPTCHA v3 */
    const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {
      action: 'submit'
    });

    /* 📸 Conversion des 2 photos en base64 */
    const photoProfilFile = document.getElementById('photoProfil').files[0];
    const photoBodyFile   = document.getElementById('photoBody').files[0];

    const photoProfilBase64 = await fileToBase64(photoProfilFile);
    const photoBodyBase64   = await fileToBase64(photoBodyFile);

    /* 📦 Préparation des données */
    const data = {
      ...collectFormData(),
      photoProfil:    photoProfilBase64,
      photoBody:      photoBodyBase64,
      recaptchaToken: recaptchaToken
    };

    /* 🚀 Envoi à Apps Script
       Content-Type "text/plain" évite le preflight CORS bloqué par Apps Script. */
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Erreur inconnue');
    }

    /* ✅ Succès : on cache le formulaire, on affiche la confirmation */
    form.style.display = 'none';
    successMsg.classList.add('visible');
    successMsg.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error('Erreur lors de l\'envoi :', err);
    alert('Une erreur est survenue. Vérifie ta connexion et réessaie.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Envoyer ma candidature';
  }
});


/* ─────────────────────────────────────────────────────────────
   VALIDATION EN TEMPS RÉEL
   Efface l'erreur dès que l'utilisateur recommence à taper.
───────────────────────────────────────────────────────────── */

['prenom', 'nom', 'email', 'telephone', 'taille'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener('input', () => {
    if (el.value.trim()) clearError(id, id + 'Error');
  });
});