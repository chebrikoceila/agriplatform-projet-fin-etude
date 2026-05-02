const express = require('express');
const passport = require('passport');
const authCtrl = require('../controller/authController');
const {
  encodeOAuthState,
  resolveFrontendFromLoginQuery,
  decodeOAuthState,
  getDefaultFrontend,
} = require('../utils/oauthFrontend');

const router = express.Router();

const googleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
  if (!googleConfigured()) {
    return res.status(503).json({ error: 'Connexion Google non configurée sur le serveur.' });
  }
  const frontendOrigin = resolveFrontendFromLoginQuery(req.query.frontend);
  const state = encodeOAuthState(frontendOrigin);
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleConfigured()) {
    const base = decodeOAuthState(req.query.state) || getDefaultFrontend();
    return res.redirect(302, `${base}/login?error=config`);
  }
  passport.authenticate('google', { session: false }, (err, user) => {
    const base = decodeOAuthState(req.query.state) || getDefaultFrontend();
    if (err || !user) {
      return res.redirect(302, `${base}/login?error=google`);
    }
    req.user = user;
    return authCtrl.googleCallbackSuccess(req, res);
  })(req, res, next);
});

module.exports = router;
