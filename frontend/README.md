# AgriTech Frontend

Le frontend d’AgriTech est l’interface utilisateur de la plateforme. Il permet à l’agriculteur, au gestionnaire ou au conseiller agricole d’interagir avec les données de parcelles, d’analyser l’état des cultures, de consulter les alertes et de piloter les performances agronomiques via un dashboard moderne.

---

## 1. Objectif de l’application frontend

L’objectif principal du frontend est de transformer les données techniques et géospatiales du backend en une expérience claire, visuelle et exploitable pour un utilisateur non technique.

Il permet notamment :

- de se connecter via Google OAuth,
- de compléter son profil professionnel,
- de visualiser ses parcelles sur une carte,
- de définir ou modifier une parcelle agricole,
- d’afficher les séries temporelles de végétation,
- de consulter les alertes et leurs niveaux de criticité,
- de surveiller l’état agronomique global via un dashboard.

---

## 2. Stack frontend

Le projet frontend utilise une stack moderne basée sur :

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- React Router DOM
- React Query
- Leaflet + React Leaflet
- Recharts / Chart.js
- React Hook Form + Zod
- Lucide React

Cette combinaison permet d’obtenir :

- une interface rapide,
- un design moderne,
- un système de composants réutilisables,
- une gestion robuste de l’état serveur,
- une navigation fluide et une UX orientée décision support.

---

## 3. Architecture du frontend

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── public/
│   ├── robots.txt
│   └── sw.js
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExportParcelleShortcutDialog.tsx
│   │   ├── NavLink.tsx
│   │   ├── PlatformSidebar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RequireCompleteProfile.tsx
│   │   └── ui/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── data/
│   │   └── wilayas.ts
│   ├── features/
│   │   └── parcelles/
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── authStorage.ts
│   │   ├── profile.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── AlertCenterPage.tsx
│   │   ├── AuthCallbackPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── Index.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFound.tsx
│   │   └── SetupPage.tsx
│   └── test/
│       ├── example.test.ts
│       └── setup.ts
└── README.md
```

---

## 4. Structure fonctionnelle

### Pages principales

#### LoginPage
L’écran de connexion permet à l’utilisateur de démarrer le flux OAuth Google. C’est la première étape pour accéder à l’application.

#### AuthCallbackPage
Cette page traite le retour de Google après authentification. Elle récupère l’état de la session et redirige vers la bonne route.

#### SetupPage
Page d’initialisation du profil, utilisée pour compléter les informations nécessaires à l’exploitation avant d’accéder au dashboard principal.

#### DashboardPage
Le cœur du système : tableau de bord synthétique avec indicateurs, séries, statut de parcelles et visualisation des tendances agronomiques.

#### Index.tsx / Parcelles
Page centrale de gestion des parcelles. Elle propose souvent la liste, le détail et l’édition d’un périmètre agricole.

#### AlertCenterPage
Centre d’alertes avec les résultats de détection d’anomalies et la logique de priorisation.

#### NotFound
Page de fallback pour les routes inconnues.

---

## 5. Gestion de l’authentification

Le frontend s’appuie sur un `AuthContext` et sur des composants de protection de routes :

- `ProtectedRoute` : garde les pages privées
- `RequireCompleteProfile` : empêche l’accès tant que le profil n’est pas complété
- `AuthContext` : garde l’état de session et les données utilisateur

Cela permet d’assurer un parcours utilisateur propre :

1. connexion,
2. callback OAuth,
3. vérification du profil,
4. accès au dashboard et aux modules agricoles.

---

## 6. Gestion des routes

La navigation est gérée avec React Router. Le fichier `App.tsx` définit la structure suivante :

```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/auth/callback" element={<AuthCallbackPage />} />
<Route element={<ProtectedRoute />}>
  <Route path="/setup" element={<SetupPage />} />
  <Route element={<RequireCompleteProfile />}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/parcelles" element={<Index />} />
    <Route path="/parcelles/:id" element={<Index />} />
    <Route path="/alertes" element={<AlertCenterPage />} />
  </Route>
</Route>
```

Cette architecture garantit que :

- les routes publiques restent accessibles,
- les routes privées nécessitent une authentification,
- le profil utilisateur doit être validé avant accès complet.

---

## 7. Fonctionnalités utilisateur

### Dashboard agronomique

Le dashboard présente :

- la santé global des parcelles,
- les différents statuts (`ok`, `warning`, `critical`),
- l’état des indices NDVI/NDWI/SAVI/GNDVI,
- les tendances temporelles,
- la répartition géographique par wilaya,
- les alertes actives.

### Gestion des parcelles

L’utilisateur peut :

- ajouter une parcelle,
- tracer sa géométrie sur la carte,
- modifier ses informations agricoles,
- consulter ses détails,
- sélectionner une parcelle précise pour analyser son évolution.

### Centre d’alertes

Le centre d’alertes permet de visualiser les anomalies détectées, avec un suivi clair du niveau de criticité et un accès rapide aux détails.

### Authentification et profil

L’application gère le cycle complet :

- connexion Google,
- stockage de la session,
- récupération du profil,
- vérification de la complétude du profil.

---

## 8. Composants UI

Le frontend utilise une base de composants réutilisables dans `src/components/ui/` :

- `button`, `card`, `dialog`, `table`, `badge`, `alert`, `chart`, etc.

Cela permet d’avoir une interface cohérente, moderne et maintenable, en s’appuyant sur Shadcn UI avec une couche de stylisation Tailwind.

---

## 9. Gestion de données et état applicatif

### React Query

Le frontend utilise `@tanstack/react-query` pour gérer les requêtes serveur et les données réseau de manière fiable.

Cela facilite :

- la récupération des données du backend,
- la mise en cache,
- les mises à jour réactives,
- la gestion des états de chargement et d’erreur.

### AuthContext

Le contexte d’authentification centralise l’état utilisateur connecté et les informations de session.

### Hooks personnalisés

Le dossier `src/hooks` contient des outils utiles comme :

- `use-mobile` : détection mobile,
- `use-toast` : notifications d’interface.

---

## 10. Cartographie

Le frontend intègre la cartographie avec Leaflet / React Leaflet, ce qui est essentiel pour :

- dessiner les parcelles,
- afficher les polygones,
- localiser les périmètres,
- visualiser les données spatiales sur une carte interactive.

---

## 11. Scripts disponibles

Le `package.json` du frontend contient les commandes suivantes :

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run preview
```

### Description

- `dev` : lancement du projet en mode développement avec Vite
- `build` : build de production
- `lint` : vérification ESLint
- `test` : tests unitaires / d’intégration avec Vitest
- `preview` : prévisualisation du build produit

---

## 12. Commandes de démarrage rapide

### Installation

```bash
cd frontend
npm install
```

### Lancement du frontend

```bash
npm run dev
```

### Build de production

```bash
npm run build
```

### Vérification de qualité

```bash
npm run lint
npm run test
```

---

## 13. Bonnes pratiques appliquées

- séparation claire entre pages, composants, contexte et logique métier,
- routes protégées selon le statut d’authentification,
- usage de composants UI standardisés,
- configuration moderne avec Vite et TypeScript,
- structure orientée maintenabilité et évolutivité,
- usage d’outils d’analyse de données visuelles pour les dashboards.

---

## 14. Points forts du frontend

- expérience utilisateur claire et moderne,
- gestion robuste de l’authentification,
- visualisation géographique de parcelles,
- tableaux de bord agronomiques exploitables,
- système d’alertes direct et lisible,
- base UI élégante et modulable.

---

## 15. Déploiement recommandé

Le frontend peut être déployé sur :

- Vercel
- Netlify
- Cloudflare Pages
- Firebase Hosting

Pour un déploiement en production, il faut souvent :

- configurer les variables d’environnement du backend,
- sécuriser les appels API,
- vérifier les routes de redirection,
- tester le comportement sur mobile et desktop,
- optimiser le build pour les usages sans carte lourdement interactive.

---

## 16. Conclusion

Le frontend AgriTech est l’interface qui transforme la donnée agronomique complexe en decisions lisibles et actionnables. Il met l’accent sur la clarté, la simplicité d’utilisation et la visualisation intelligente des parcelles et des indices végétaux.

Il est conçu pour offrir une expérience fluides aux agriculteurs et gestionnaires, en leur permettant de suivre l’état de leurs cultures, détecter les risques et piloter leurs exploitations avec plus de précision.
