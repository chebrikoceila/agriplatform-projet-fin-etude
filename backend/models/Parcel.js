const mongoose = require('mongoose');

const parcelleSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    proprietaire: { type: String, required: true }, // Ou ObjectId si tu as déjà l'auth
    cultureType: String,
    surface: Number, // en hectares par exemple
    geometry: {
        type: { type: String, enum: ['Polygon'], required: true },
        coordinates: { type: [[[Number]]], required: true } // [ [ [lng, lat], ... ] ]
    },
    ndviMoyen: {Number},
    ndwiMoyen: {Number},
    analytics: {Array},
    createdAt: { type: Date, default: Date.now }
});

// Index spatial pour optimiser les requêtes géographiques
parcelleSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Parcelle', parcelleSchema);