require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');
const { configurePassport } = require('./config/passport');
const authJwt = require('./middleware/authJwt');
const parcelleRoutes = require('./Routes/parcelleRoutes');
const alertRoutes = require('./Routes/alertRoutes');
const pushRoutes = require('./Routes/pushRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const authRoutes = require('./Routes/authRoutes');
const authApiRoutes = require('./Routes/authApiRoutes');
const initializeGEE = require('./services/geeAuth');
const { configureWebPush } = require('./services/pushService');
const { startStressWorker } = require('./services/stressWorker');

const app = express();

configurePassport();

const corsOrigin = process.env.FRONTEND_URL || true;
app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(passport.initialize());

initializeGEE();
configureWebPush();

// OAuth : même routeur sous /auth et /api/auth pour coller à l’URI enregistrée dans Google Cloud
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', authApiRoutes);

app.use('/api/parcelles', authJwt, parcelleRoutes);
app.use('/api/alertes', authJwt, alertRoutes);
app.use('/api/push', authJwt, pushRoutes);
app.use('/api/dashboard', authJwt, dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serveur backend opérationnel',
    database: mongoose.connection.readyState === 1 ? 'connectée' : 'déconnectée',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
    startStressWorker();
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

startServer();
