const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    parcelleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parcelle',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['Stress Hydrique', 'Santé', 'Mise à jour'],
        required: true
    },
    valeurIndice: { type: Number, required: true },
    rapport: { type: String },
    date: { type: Date, default: Date.now, index: true },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Alerte', alertSchema);
