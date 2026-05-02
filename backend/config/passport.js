const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Configure la stratégie Google OAuth (sans session Express).
 */
function configurePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.warn(
      '[auth] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET manquant — routes /auth/google désactivées.'
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('Aucun e-mail renvoyé par Google'), null);
          }

          const user = await User.findOneAndUpdate(
            { googleId: profile.id },
            {
              $set: {
                email: email.toLowerCase(),
                nom: profile.name?.familyName || '',
                prenom: profile.name?.givenName || '',
                photo: profile.photos?.[0]?.value || '',
              },
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
          );

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

module.exports = { configurePassport };
