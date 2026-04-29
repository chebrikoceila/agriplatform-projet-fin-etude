const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db')
const parcelleRoutes = require('./routes/parcelleRoutes');
const initializeGEE = require('./services/geeAuth');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes de test
initializeGEE();

// Routes
app.use('/api/parcelles', parcelleRoutes);

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
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

startServer();