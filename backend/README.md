Flux de Données Principal :

User → Frontend : L'agriculteur dessine sa parcelle
Frontend → Backend : Envoie les coordonnées GPS (GeoJSON)
Backend → MongoDB : Sauvegarde la parcelle
Backend → GEE : Demande les images Sentinel-2 pour cette zone
GEE → Backend : Retourne NDVI/NDWI calculés
Backend → MongoDB : Stocke les séries temporelles
Backend → Frontend : Renvoie les données pour visualisation

agriculture-monitoring-backend/
│
├── config/                          # ⚙️ Configuration centrale
│   ├── database.js                  # Connexion MongoDB (Mongoose)
│   ├── gee.config.js                # Config GEE (Service Account, scopes)
│   ├── auth.config.js               # Secrets OAuth 2.0 (Google Client ID/Secret)
│   └── app.config.js                # Variables globales (PORT, NODE_ENV, URLs)
│
├── src/                             # 🧩 Code source principal
│   │
│   ├── models/                      # 📊 Schémas MongoDB (Mongoose)
│   │   ├── User.js                  # Schema utilisateur (nom, email, wilaya, role)
│   │   ├── Parcel.js                # Schema parcelle (geometry, surface, user_id)
│   │   ├── SatelliteData.js         # Schema données satellites (NDVI/NDWI time-series)
│   │   └── Alert.js                 # Schema alertes (type, date, parcel_id, seuil)
│   │
│   ├── controllers/                 # 🎮 Logique métier (handlers de routes)
│   │   ├── authController.js        # Login OAuth 2.0, JWT generation, logout
│   │   ├── userController.js        # CRUD utilisateurs, profil
│   │   ├── parcelController.js      # CRUD parcelles (create, list, update, delete)
│   │   ├── satelliteController.js   # Récupération images + calcul indices GEE
│   │   ├── alertController.js       # Génération alertes (règles seuils)
│   │   └── reportController.js      # Génération rapports PDF/CSV
│   │
│   ├── routes/                      # 🛣️ Définition des endpoints API
│   │   ├── auth.routes.js           # POST /auth/google, GET /auth/callback
│   │   ├── user.routes.js           # GET/PUT /users/:id
│   │   ├── parcel.routes.js         # CRUD /parcels
│   │   ├── satellite.routes.js      # GET /parcels/:id/ndvi?start=2024-01&end=2024-12
│   │   ├── alert.routes.js          # GET /parcels/:id/alerts
│   │   └── report.routes.js         # POST /parcels/:id/report (PDF download)
│   │
│   ├── middlewares/                 # 🛡️ Middlewares Express
│   │   ├── authMiddleware.js        # Vérification JWT (protect routes privées)
│   │   ├── validationMiddleware.js  # Validation des inputs (express-validator)
│   │   ├── errorHandler.js          # Gestionnaire d'erreurs global
│   │   └── rateLimiter.js           # Rate limiting (éviter abus API)
│   │
│   ├── services/                    # 🔧 Logique réutilisable (business logic)
│   │   ├── geeService.js            # Interaction avec GEE (auth, fetch images, calcul indices)
│   │   ├── alertService.js          # Logique détection stress (règles seuils)
│   │   ├── pdfService.js            # Génération PDF (pdfkit ou puppeteer)
│   │   ├── emailService.js          # Envoi emails (nodemailer) - optionnel
│   │   └── storageService.js        # Upload/download fichiers (si stockage GeoTIFF local)
└── app.js                       # 🚀 Point d'entrée Express (setup middlewares, routes)
├── .env.example                     # 🔐 Template variables d'environnement
├── .env                             # 🔐 Variables réelles (GITIGNORE !)
├── .gitignore                       # 🚫 Fichiers à ignorer (node_modules, .env)
├── package.json                     # 📦 Dépendances npm
├── package-lock.json                # 📦 Lock versions
├── server.js                        # 🎬 Point d'entrée serveur (lance app.js)
└── README.md                        # 📖 Instructions setup projet
