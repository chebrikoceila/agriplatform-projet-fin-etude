/**
 * Script de migration : associe les parcelles existantes (sans userId)
 * au premier utilisateur trouvé dans la base de données.
 *
 * Usage : node scripts/migrateParcellesToUser.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI introuvable dans .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  googleId: String, email: String, nom: String,
}, { strict: false });
const User = mongoose.model('User', userSchema);

const parcelleSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { strict: false });
const Parcelle = mongoose.model('Parcelle', parcelleSchema);

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connecté à MongoDB');

  // Trouver le premier utilisateur enregistré
  const user = await User.findOne().sort({ createdAt: 1 });
  if (!user) {
    console.error('❌  Aucun utilisateur trouvé dans la base de données.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`👤  Utilisateur trouvé : ${user.email} (${user._id})`);

  // Mettre à jour les parcelles sans userId
  const result = await Parcelle.updateMany(
    { userId: { $exists: false } },
    { $set: { userId: user._id } }
  );
  console.log(`✅  ${result.modifiedCount} parcelle(s) migrée(s) vers l'utilisateur ${user.email}`);

  await mongoose.disconnect();
  console.log('🔌  Déconnecté de MongoDB');
};

run().catch((err) => {
  console.error('❌  Erreur de migration :', err);
  process.exit(1);
});
