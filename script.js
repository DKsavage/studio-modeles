'use strict';

const form       = document.getElementById('modelForm');
const submitBtn  = document.getElementById('submitBtn');
const successMsg = document.getElementById('successMessage');

/**
 * Affiche une erreur sur un champ.
 * @param {string} inputId - l'id de l'input
 * @param {string} errorId - l'id du message d'erreur
 */
function showError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) error.classList.add('visible');
}
 
/**
 * Efface l'erreur sur un champ.
 */
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
 
  if (pseudo.startsWith('@')) {
    pseudo = pseudo.substring(1); /* substring(1) = à partir du 2e caractère */
  }
 
  if (pseudo.endsWith('/')) {
    pseudo = pseudo.slice(0, -1); /* slice(0, -1) = tout sauf le dernier caractère */
  }

  if (!pseudo) return '';
 
  return `https://instagram.com/${pseudo}`;
}

function setupUpload(inputId, previewId, zoneId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const zone    = document.getElementById(zoneId);
 
  /*
    Événements courants :
    'click'  → clic de souris
    'change' → changement de valeur (input, select, file)
    'input'  → chaque frappe dans un champ texte
    'submit' → soumission d'un formulaire
    'focus'  → quand un champ reçoit le focus
    'blur'   → quand un champ perd le focus
  */
  input.addEventListener('change', function(event) {
    /*
      event = objet automatiquement passé par le navigateur.
      event.target          → l'élément qui a déclenché l'événement
      event.target.files    → la liste des fichiers sélectionnés
      event.target.files[0] → le premier (et seul) fichier
    */
    const file = event.target.files[0];
 
    /* Garde-fou : si aucun fichier, on s'arrête */
    if (!file) return;
 
    const reader = new FileReader();
 
    /* Callback : s'exécute QUAND la lecture est terminée */
    reader.onload = function(e) {
      preview.src = e.target.result;  /* URL base64 de l'image */
      preview.style.display = 'block'; /* affiche l'aperçu */
      zone.classList.add('has-photo'); /* modifie le style de la zone */
      zone.querySelector('.upload-placeholder').style.display = 'none';
    };
 
    reader.readAsDataURL(file);
  });
}

/* On initialise les deux zones d'upload */
setupUpload('photoProfil', 'previewProfil', 'zoneProfil');
setupUpload('photoBody',   'previewBody',   'zoneBody');

function validateForm() {
  let isValid = true; /* on suppose que c'est valide au départ */
 
  /* --- Prénom --- */
  /*
    .value → récupère la valeur saisie dans l'input
    .trim() → supprime les espaces en début et fin
    Ex : "  Camille  " → "Camille"
  */
  const prenom = document.getElementById('prenom').value.trim();
  if (!prenom) {
    showError('prenom', 'prenomError');
    isValid = false;
  } else {
    clearError('prenom', 'prenomError');
  }
 
  /* --- Nom --- */
  const nom = document.getElementById('nom').value.trim();
  if (!nom) {
    showError('nom', 'nomError');
    isValid = false;
  } else {
    clearError('nom', 'nomError');
  }
 
  /* --- Email (avec vérification du format via regex) --- */
  const email = document.getElementById('email').value.trim();
  if (!email || !isValidEmail(email)) {
    showError('email', 'emailError');
    isValid = false;
  } else {
    clearError('email', 'emailError');
  }
 
  /* --- Téléphone --- */
  const telephone = document.getElementById('telephone').value.trim();
  if (!telephone) {
    showError('telephone', 'telephoneError');
    isValid = false;
  } else {
    clearError('telephone', 'telephoneError');
  }
 
  /* --- Taille (entre 140 et 220 cm) --- */

  const taille = Number(document.getElementById('taille').value);
  if (!taille || taille < 140 || taille > 220) {
    showError('taille', 'tailleError');
    isValid = false;
  } else {
    clearError('taille', 'tailleError');
  }
 
  /* --- Photos requises --- */
  if (!document.getElementById('photoProfil').files[0]) {
    document.getElementById('profilError').classList.add('visible');
    isValid = false;
  } else {
    document.getElementById('profilError').classList.remove('visible');
  }
 
  if (!document.getElementById('photoBody').files[0]) {
    document.getElementById('bodyError').classList.add('visible');
    isValid = false;
  } else {
    document.getElementById('bodyError').classList.remove('visible');
  }
 
  /* --- Genre (boutons radio) --- */
  const genre = document.querySelector('input[name="genre"]:checked');
  if (!genre) {
    document.getElementById('genreError').classList.add('visible');
    isValid = false;
  } else {
    document.getElementById('genreError').classList.remove('visible');
  }
 
  /* --- Taille haut (boutons radio) --- */
  /*
    querySelector avec :checked trouve le radio sélectionné.
    Si aucun → retourne null → !null = true → erreur affichée.
  */
  const tailleHaut = document.querySelector('input[name="tailleHaut"]:checked');
  if (!tailleHaut) {
    document.getElementById('tailleHautError').classList.add('visible');
    isValid = false;
  } else {
    document.getElementById('tailleHautError').classList.remove('visible');
  }
 
  /* --- Taille bas --- */
  const tailleBas = document.querySelector('input[name="tailleBas"]:checked');
  if (!tailleBas) {
    document.getElementById('tailleBasError').classList.add('visible');
    isValid = false;
  } else {
    document.getElementById('tailleBasError').classList.remove('visible');
  }
 
  /* --- Expérience --- */
  const experience = document.getElementById('experience').value;
  if (!experience) {
    showError('experience', 'experienceError');
    isValid = false;
  } else {
    clearError('experience', 'experienceError');
  }
 
  return isValid;
}

function collectFormData() {
  return {
    prenom:        document.getElementById('prenom').value.trim(),
    nom:           document.getElementById('nom').value.trim(),
    email:         document.getElementById('email').value.trim(),
    telephone:     document.getElementById('telephone').value.trim(),
    instagram:     formatInstagramUrl(document.getElementById('instagram').value),
    taille:        document.getElementById('taille').value,
 
    genre:         (document.querySelector('input[name="genre"]:checked') || {}).value || '',
 
    /* --- Mensurations (champs numériques optionnels) --- */
    poitrine:      document.getElementById('poitrine').value,
    tourTaille:    document.getElementById('tourTaille').value,
    hanches:       document.getElementById('hanches').value,
    pointure:      document.getElementById('pointure').value,
 
    tailleHaut:    (document.querySelector('input[name="tailleHaut"]:checked') || {}).value || '',
    tailleBas:     (document.querySelector('input[name="tailleBas"]:checked') || {}).value || '',
 
    experience:    document.getElementById('experience').value,
    disponibilite: document.getElementById('disponibilite').value,

    /*
      new Date() = objet date représentant maintenant
      .toLocaleDateString('fr-FR') → format "28/04/2026"
    */
    dateInscription: new Date().toLocaleDateString('fr-FR'),
  };
}


form.addEventListener('submit', async function(event) {
  
  event.preventDefault();
 
  /* On valide d'abord */
  if (!validateForm()) {
    /* Scroll vers la première erreur visible */
    const firstError = document.querySelector('.error, .field-error.visible');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return; /* on arrête ici si invalide */
  }
 
  /* On désactive le bouton pour éviter les double-clics */
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';
 
  /* On collecte les données */
  const data = collectFormData();
 
  
  console.log('📦 Données prêtes à envoyer :', data);
 
  /* Simulation d'un délai d'envoi (1.5 secondes) */
  /* À REMPLACER par : await fetch(URL_GOOGLE_SCRIPT, {...}) */
  await new Promise(resolve => setTimeout(resolve, 1500));
 
  /* Succès : on cache le formulaire, on affiche le message */
  form.style.display = 'none';
  successMsg.classList.add('visible');
  successMsg.scrollIntoView({ behavior: 'smooth' });
});
 
 

['prenom', 'nom', 'email', 'telephone', 'taille'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
 
  el.addEventListener('input', () => {
    if (el.value.trim()) {
      clearError(id, id + 'Error');
    }
  });
});
 
 