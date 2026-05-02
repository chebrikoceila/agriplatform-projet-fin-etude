const mongoose = require('mongoose');

const parcelleSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Propriétaire authentifié
    proprietaire: { type: String, required: true }, // Nom affiché du propriétaire
    cultureType: String,
    datePlantation: { type: Date }, // Début du cycle phénologique
    status: {
        type: String,
        enum: ['ok', 'warning', 'critical'],
        default: 'ok'
    },
    surface: Number, // en hectares par exemple
    geometry: {
        type: { type: String, enum: ['Polygon'], required: true },
        coordinates: { type: [[[Number]]], required: true } // [ [ [lng, lat], ... ] ]
    },
    ndviMoyen: { type: Number },
    ndwiMoyen: { type: Number },
    lastAnalyzedCaptureDate: { type: Date },
    analytics: { type: Array },
    createdAt: { type: Date, default: Date.now }
});

// Index spatial pour optimiser les requêtes géographiques
parcelleSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Parcelle', parcelleSchema);