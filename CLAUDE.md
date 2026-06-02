# CLAUDE.md — Lumina Photography (studio-modeles)

Lis ce fichier en entier avant de commencer. Il remplace la mémoire de session.

---

## Projet

Site d'inscription mannequins pour **Lumina Photography** (agence de casting Montréal).

- **URL prod** : https://studio-modeles.vercel.app/
- **GitHub** : repo `studio-modeles`, branche `main` → auto-deploy Vercel
- **Propriétaire** : DKsavage

---

## Stack technique

| Couche | Outil |
|---|---|
| Frontend | HTML/CSS vanilla + Tailwind CSS v3 |
| CSS build | `npm run build` → `tailwindcss -i src/input.css -o style.css --minify` |
| Hosting | Vercel (deploy automatique sur push `main`) |
| API | Vercel Functions (`/api/*.js`) |
| Base de données | Supabase PostgreSQL — table `candidatures` |
| Stockage photos | Supabase Storage — bucket `photos-candidatures` (privé, 2 Mo max) |
| Auth | Supabase Auth — email + OTP 8 chiffres |
| Emails | Resend — `casting@luminamodels.ca` |
| Ancienne stack | ~~Google Apps Script + Sheets + Drive~~ → **complètement remplacée** |

---

## Fichiers principaux

```
studio-modeles/
├── index.html          → formulaire d'inscription (page publique)
├── login.html          → login admin (email + OTP 8 chiffres)
├── admin.html          → dashboard admin (liste candidatures + envoi sessions)
├── script.js           → JS formulaire d'inscription
├── style.css           → CSS compilé par Tailwind (ne pas éditer manuellement)
├── src/input.css       → source Tailwind CSS (éditer ici)
├── tailwind.config.js  → config Tailwind
├── package.json        → scripts build/dev
├── vercel.json         → config Vercel (outputDirectory: ".")
├── .env.local          → variables d'env locales (ignoré par git)
└── api/
    ├── submit.js       → POST inscription (honeypot + rate limit + reCAPTCHA + Supabase)
    ├── candidatures.js → GET liste candidatures (auth requise)
    ├── login.js        → POST envoi OTP email
    ├── otp.js          → POST vérification OTP → session token
    ├── verify-otp.js   → helper vérif OTP Supabase
    ├── select.js       → POST sélection/désélection mannequins
    └── send-session.js → POST envoi convocations par email (Resend, bilingue FR/EN)
```

---

## Variables d'environnement

Dans `.env.local` (local) et Vercel Dashboard (prod) :

```
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=eyJ...         # clé service_role (jamais exposée au client)
SUPABASE_ANON_KEY=eyJ...            # clé anon (utilisée côté admin auth)
RESEND_API_KEY=re_...               # envoi emails Resend
RECAPTCHA_SECRET_KEY=6Ldd...        # reCAPTCHA v3 (seuil 0.5)
```

Identifiants de référence (à ne pas changer sans raison) :
- `RECAPTCHA_SITE_KEY` (public, dans index.html) : `6LddUeAsAAAAAO4fcgYselTJy8a0EBen0SoPookQ`
- reCAPTCHA version : **v3** (pas v2)

---

## Roadmap des phases

| Phase | Description | Statut |
|---|---|---|
| 0 | Base fonctionnelle | ✅ |
| 1 | Mise en ligne Vercel | ✅ |
| 2 | Sécurité (honeypot, rate limit 60s, reCAPTCHA v3) | ✅ |
| 2bis | Nettoyage code production | ✅ |
| 3 | Performance (compression images, Lighthouse) | ✅ |
| 4 | Migration backend → Vercel Functions + Supabase | ✅ |
| 5 | Pro (auth OTP, dashboard admin, emails Resend) | ✅ (voir détail) |
| 6 | Refonte design Tailwind (rouge, luxe, moderne) | ✅ |

### Détail Phase 5 (terminée mai 2026)

- ✅ Auth admin : `login.html` → OTP 8 chiffres via Supabase Auth
- ✅ Dashboard admin : `admin.html` → portrait cards, stats count-up, search, sélection multiple
- ✅ Sélection groupée : barre d'action flottante, toast, envoi groupé
- ✅ Composer de session : formulaire bilingue (FR/EN), date, adresse, groupes, notes, moodboard, WhatsApp
- ✅ Envoi convocations : `send-session.js` → Resend, template HTML bilingue, auth JWT vérifiée
- ✅ Corrections dashboard : carte status verte (sélectionné), date picker, adresse unique, notifier email

### Ce qui reste (Phase 7 possible)

- ⏳ Domaine custom (`luminamodels.ca` ou similaire)
- ⏳ Refonte design Phase 6 plus poussée (voir ci-dessous)

---

## Refonte design — Prochaine priorité CSS

L'utilisateur veut retravailler le CSS pour un résultat encore plus haut de gamme.

- `style.css` / `src/input.css` — polish formulaire d'inscription
- `admin.html` — design dashboard plus élaboré
- Direction : moderne, luxe, cohérent avec agence de mannequinat
- Demander des références visuelles (moodboard) avant de commencer

---

## Workflow de développement

### CSS (Tailwind)
```bash
npm run dev    # watch mode (dev local)
npm run build  # compile + minify → style.css (avant commit)
```

### Git — règles absolues
- **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `docs:`, `test:`, `style:`
- **git add sélectif** : jamais `git add .` — toujours `git add <fichier>`
- **Pas de Co-Authored-By** dans les messages de commit
- Push `main` → Vercel redéploie automatiquement

### Vercel Functions (API)
- Tous les fichiers dans `api/` sont des Vercel Functions Node.js
- `module.exports = async function handler(req, res)` → pattern standard
- Les variables `.env.local` sont lues automatiquement en local avec `vercel dev`

---

## Points techniques critiques (éviter de répéter les bugs)

1. **reCAPTCHA** : version v3, seuil 0.5 — ne pas recréer en v2
2. **CORS** : résolu grâce aux Vercel Functions (même domaine que le frontend) — plus de hack `Content-Type: text/plain`
3. **Supabase Auth** : OTP 8 chiffres — la table OTP dans Supabase doit correspondre
4. **Rate limit** : `Map()` en mémoire dans `submit.js` — suffit pour l'usage actuel, se remet à zéro à chaque redéploiement
5. **Photos** : MAX 1.5 Mo par photo (`submit.js`), bucket Supabase Storage privé
6. **Noms de fichiers photos** : `email_timestamp_profil.jpg` / `email_timestamp_body.jpg`
7. **`Code.gs`** n'existe **pas** localement — ancienne stack Google, complètement abandonnée

---

## Préférences de collaboration

- **Commentaires dans le code** : expliquer le POURQUOI, pas le QUOI
- **Modifier le fichier existant** : ne pas réécrire from scratch
- **Défis de compréhension** : proposer un défi en fin de session (l'utilisateur apprécie)
- **Résumé roadmap** : rappeler où on en est dans les phases
- **Style de réponse** : dense, direct — phrases courtes, pas de remplissage
- **Niveau** : débutant en HTML/CSS/JS — toujours expliquer les concepts non évidents

---

## Profil utilisateur

- Francophone, Montréal
- Débutant en HTML/CSS/JS — apprend vite via projet concret
- Maîtrise : Git/GitHub, Mac + VS Code, workflow Vercel
- Apprend via exemples réels, pas via tutoriels abstraits
