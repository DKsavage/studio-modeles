# CLAUDE.md — Lumina Photography (studio-modeles)

Lis ce fichier en entier avant de commencer. Il remplace la mémoire de session.

---

## Règles Claude — à appliquer sans exception

### Démarrage de session

1. **CLAUDE.md obligatoire** : chaque projet doit avoir un `CLAUDE.md`. Le lire en premier. Y écrire tout ce qui est pertinent à retenir (stack, règles, phases, bugs résolus, décisions).
2. **Carte graphify en premier** : si `graphify-out/GRAPH_REPORT.md` existe → le lire avant tout `Read` sur un fichier source. Si la réponse est dans le graphe, l'utiliser sans relire le fichier brut.
3. **Pas de graphify-out** → lancer `/graphify .` immédiatement avant toute exploration du code.

### Efficacité et tokens

1. **Utiliser les skills disponibles** pour réduire les tokens et être efficace :
   - `/graphify` — carte du projet, évite les relectures inutiles
   - `/fewer-permission-prompts` — réduire les confirmations répétitives
   - `/graphify query "question"` — répondre depuis le graphe sans lire les fichiers

### Règles Git

1. **Pas de `Co-Authored-By: Claude`** dans les commits — jamais.
2. **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `docs:`, `test:`, `style:`
3. **`git add` sélectif** — jamais `git add .`, toujours `git add <fichier>` ciblé.

### Règles Code

1. **Modifier le fichier existant** — jamais réécrire from scratch.
2. **Commentaires pédagogiques** : expliquer le POURQUOI, pas le QUOI.

### Style de réponse

1. **Phrases courtes** — 3 à 6 mots max, zéro remplissage, zéro prose inutile.
2. **Outils d'abord** — lancer les outils, montrer le résultat, s'arrêter.
3. **Direct** — jamais narrer l'action, juste la faire.

### Pédagogie

1. **Défi de compréhension** en fin de session si du code a été écrit.
2. **Résumé roadmap** quand pertinent — rappeler où on en est dans les phases.

---

## Projet

Site d'inscription mannequins pour **Lumina Photography** (agence de casting Montréal).

- **URL prod** : `https://studio-modeles.vercel.app/`
- **GitHub** : repo `studio-modeles`, branche `main` → auto-deploy Vercel
- **Propriétaire** : DKsavage

---

## Stack technique

### Stack actuelle (HTML vanilla — legacy)

| Couche | Outil |
| --- | --- |
| Frontend | HTML/CSS vanilla + Tailwind CSS v3 |
| CSS build | `npm run build` → `tailwindcss -i src/input.css -o style.css --minify` |
| Hosting | Vercel (deploy automatique sur push `main`) |
| API | Vercel Functions (`/api/*.js`) |
| Base de données | Supabase PostgreSQL — table `candidatures` |
| Stockage photos | Supabase Storage — bucket `photos-candidatures` (privé, 2 Mo max) |
| Auth | Supabase Auth — email + OTP 8 chiffres |
| Emails | Resend — `casting@luminamodels.ca` |
| Ancienne stack | ~~Google Apps Script + Sheets + Drive~~ → complètement remplacée |

### Stack cible — Phase 7 (migration Next.js)

| Couche | Outil |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript strict |
| Styles | Tailwind CSS v4 |
| Composants UI | shadcn/ui (MCP configuré dans `.mcp.json`) |
| Animations | Framer Motion — Ken Burns, clip-path reveals, count-up |
| Images | `next/image` avec `fill` + `priority` sur le hero |
| Backend | Route Handlers Next.js (`app/api/`) |
| Base de données | Supabase PostgreSQL (inchangé) |
| Auth | Supabase Auth OTP 8 chiffres (inchangé) |
| Emails | Resend (inchangé) |
| Hosting | Vercel (inchangé) |

---

## Fichiers principaux

```text
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

```bash
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=eyJ...         # clé service_role (jamais exposée au client)
SUPABASE_ANON_KEY=eyJ...            # clé anon (utilisée côté admin auth)
RESEND_API_KEY=re_...               # envoi emails Resend
RECAPTCHA_SECRET_KEY=6Ldd...        # reCAPTCHA v3 (seuil 0.5)
```

Identifiants fixes :

- `RECAPTCHA_SITE_KEY` (public, dans index.html) : `6LddUeAsAAAAAO4fcgYselTJy8a0EBen0SoPookQ`
- reCAPTCHA version : **v3** (pas v2)

---

## Roadmap des phases

| Phase | Description | Statut |
| --- | --- | --- |
| 0 | Base fonctionnelle | ✅ |
| 1 | Mise en ligne Vercel | ✅ |
| 2 | Sécurité (honeypot, rate limit 60s, reCAPTCHA v3) | ✅ |
| 2bis | Nettoyage code production | ✅ |
| 3 | Performance (compression images, Lighthouse) | ✅ |
| 4 | Migration backend → Vercel Functions + Supabase | ✅ |
| 5 | Pro (auth OTP, dashboard admin, emails Resend) | ✅ |
| 6 | Refonte design Tailwind (rouge, luxe, moderne) | ✅ |

### Détail Phase 5 (terminée mai 2026)

- ✅ Auth admin : `login.html` → OTP 8 chiffres via Supabase Auth
- ✅ Dashboard admin : portrait cards, stats count-up, search, sélection multiple
- ✅ Sélection groupée : barre d'action flottante, toast, envoi groupé
- ✅ Composer de session : formulaire bilingue (FR/EN), date, adresse, groupes, notes, moodboard, WhatsApp
- ✅ Envoi convocations : `send-session.js` → Resend, template HTML bilingue, auth JWT vérifiée
- ✅ Corrections dashboard : carte status verte, date picker, adresse unique, notifier email

### Phase 7 — Migration Next.js + TypeScript + Design Couture (en cours)

**Décision (juin 2026) :** Migration complète vers Next.js 15 / TypeScript / Tailwind v4 / shadcn.
Maquette de référence : **`docs/mockup-D-couture.html`** — "Couture Blanche".

#### Direction artistique validée — Mockup D "Couture Blanche"

| Élément | Valeur |
| --- | --- |
| DA | Loro Piana · Hermès · The Row — luxe éditorial |
| Fond | `#F7F3EE` papier chaud (grain SVG) |
| Rouge | `#8B0020` profond |
| Blush | `#EDD8D8` surfaces secondaires |
| Champagne | `#C4A05A` micro-accents |
| Police display | Cormorant Garamond 300 italic |
| Police UI | Montserrat 200/300/500 |
| Layout hero | Split 48/52 — formulaire gauche, photo Ken Burns droite |
| Formulaire | 3 étapes, inputs underline-only, 0 border-radius |
| Animations | Ken Burns 14s, clip-path text reveal, count-up stats, scroll reveal |
| Curseur | Croix rouge fine (custom CSS) |
| Grain | SVG noise 0.028 opacity sur `body::after` |

#### Composants Next.js à créer

```
app/
├── page.tsx                  → Hero split (photo + form)
├── layout.tsx                → Font load, metadata
├── globals.css               → Tokens CSS, grain
├── candidature/
│   └── [step]/page.tsx       → Étapes 2 et 3
└── api/
    ├── submit/route.ts       → POST candidature (port de submit.js)
    └── ...

components/
├── hero/
│   ├── HeroSplit.tsx         → Split 48/52
│   ├── PhotoSlideshow.tsx    → Ken Burns + crossfade
│   └── ScrollIndicator.tsx
├── form/
│   ├── CandidatureForm.tsx   → Multi-step wrapper
│   ├── StepPhotos.tsx
│   ├── StepProfil.tsx
│   └── StepMensurations.tsx
├── sections/
│   ├── StatsBar.tsx          → Count-up animé
│   ├── PhotoStrip.tsx        → Bandes défilantes
│   ├── ProcessSection.tsx
│   └── DarkSection.tsx
└── ui/                       → shadcn components
```

#### Checklist migration

- [ ] `npx create-next-app@latest` dans nouveau dossier — TypeScript, Tailwind, App Router
- [ ] `npx shadcn@latest init -d` → config components.json
- [ ] Porter tokens CSS de mockup-D vers `globals.css`
- [ ] Créer `PhotoSlideshow.tsx` — Framer Motion + `next/image`
- [ ] Porter logique `submit.js` → `app/api/submit/route.ts` (TypeScript + Zod)
- [ ] Port auth OTP admin → `app/admin/`
- [ ] `prefers-reduced-motion` sur Ken Burns + marquee
- [ ] Tests TypeScript : `npx tsc --noEmit` avant chaque commit

#### Points de vigilance

- `next/image` obligatoire pour toutes les photos — jamais `<img>` nu
- Ken Burns = `CSS animation` sur le container, PAS sur `next/image` directement
- Les Vercel Functions (`api/*.js`) deviennent des **Route Handlers** (`app/api/*/route.ts`)
- Garder `SUPABASE_SERVICE_KEY` côté serveur uniquement (jamais `NEXT_PUBLIC_`)
- shadcn MCP configuré dans `.mcp.json` → actif quand Claude Code est ouvert depuis ce dossier

- ⏳ Domaine custom (`luminamodels.ca`) — après migration

---

## Workflow de développement

### CSS Tailwind

```bash
npm run dev    # watch mode (dev local)
npm run build  # compile + minify → style.css (avant commit)
```

### Commandes Git

- **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `docs:`, `test:`, `style:`
- **git add sélectif** : jamais `git add .` — toujours `git add <fichier>`
- **Pas de Co-Authored-By** dans les messages de commit
- Push `main` → Vercel redéploie automatiquement

### Vercel Functions

- Tous les fichiers dans `api/` sont des Vercel Functions Node.js
- Pattern standard : `module.exports = async function handler(req, res)`
- Variables `.env.local` lues automatiquement en local avec `vercel dev`

---

## Points techniques critiques

1. **reCAPTCHA** : version v3, seuil 0.5 — ne pas recréer en v2
2. **CORS** : résolu grâce aux Vercel Functions (même domaine) — plus de hack `Content-Type: text/plain`
3. **Supabase Auth** : OTP 8 chiffres — la config Supabase doit correspondre
4. **Rate limit** : `Map()` en mémoire dans `submit.js` — se remet à zéro à chaque redéploiement
5. **Photos** : MAX 1.5 Mo par photo (`submit.js`), bucket Supabase Storage privé
6. **Noms fichiers photos** : `email_timestamp_profil.jpg` / `email_timestamp_body.jpg`
7. **`Code.gs`** n'existe pas localement — ancienne stack Google, complètement abandonnée

---

## Profil utilisateur

- Francophone, Montréal
- Débutant en HTML/CSS/JS — apprend vite via projet concret
- Maîtrise : Git/GitHub, Mac + VS Code, workflow Vercel
- Apprend via exemples réels, pas via tutoriels abstraits
- Niveau débutant → toujours expliquer les concepts non évidents

---

## Mode pédagogique — règles d'enseignement

Ces règles s'appliquent à TOUTES les sessions de code sur ce projet.

### Avant de modifier un fichier
1. **Montrer le fichier** ciblé — nom, chemin, rôle en 1 phrase
2. **Expliquer ce qu'on va faire** — et POURQUOI ce choix technique
3. **Attendre** si l'utilisateur a des questions avant d'implémenter

### Pendant l'implémentation
1. **Commenter le POURQUOI** dans le code — jamais le QUOI
2. **Expliquer les concepts non évidents** au fil du code (ex: pourquoi `fill` sur `next/image`, pourquoi `GPU compositing`)
3. **Structure claire** — toujours dire : "ce fichier fait X, ce composant est appelé par Y, cette fonction existe parce que Z"

### Skills & plugins à utiliser pour la Phase 7 (design engineering)
Ordre d'activation recommandé :
1. `high-end-visual-design` — DA luxe (tokens, typo, espace blanc)
2. `frontend-design` — TSX production-grade
3. `emil-design-eng` — composants vivants (pas juste HTML)
4. `vercel:shadcn` — composants Input/Button/Select formulaire
5. `12-principles-of-animation` — Ken Burns, clip-path, transitions
6. `fixing-motion-performance` — 60fps, GPU compositing
7. `make-interfaces-feel-better` — micro-polish final
8. `fixing-accessibility` — contraste, focus, labels WCAG
