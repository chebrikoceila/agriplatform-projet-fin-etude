const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  nom: { type: String, default: '' },
  prenom: { type: String, default: '' },
  photo: { type: String, default: '' },
  role: {
    type: String,
    enum: ['agriculteur', 'conseiller', 'admin'],
    default: 'agriculteur',
  },
  wilaya: { type: String, default: '' },
  nomExploitation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
