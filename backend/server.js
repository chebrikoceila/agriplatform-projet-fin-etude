const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db')
const parcelleRoutes = require('./Routes/parcelleRoutes');
const alertRoutes = require('./Routes/alertRoutes');
const pushRoutes = require('./Routes/pushRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const initializeGEE = require('./services/geeAuth');
const { configureWebPush } = require('./services/pushService');
const { startStressWorker } = require('./services/stressWorker');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes de test
initializeGEE();
configureWebPush();

// Routes
app.use('/api/parcelles', parcelleRoutes);
app.use('/api/alertes', alertRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Serveur backend opérationnel',
    database: mongoose.connection.readyState === 1 ? 'connectée' : 'déconnectée',
    timestamp: new Date().toISOString()
  });
});



// Fonction de démarrage
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
      console.log(`Documentation tests : http://localhost:${PORT}/api/test`);
    });
    startStressWorker();
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

startServer();