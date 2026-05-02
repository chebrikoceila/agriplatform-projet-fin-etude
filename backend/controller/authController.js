const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { decodeOAuthState, getDefaultFrontend } = require('../utils/oauthFrontend');

const issueJwt = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const payload = {
    userId: String(user._id),
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, secret, { expiresIn });
};

exports.googleCallbackSuccess = (req, res) => {
  const frontendBase = decodeOAuthState(req.query.state) || getDefaultFrontend();

  const user = req.user;
  if (!user) {
    return res.redirect(302, `${frontendBase}/login?error=google`);
  }

  const token = issueJwt(user);
  if (!token) {
    console.error('[auth] JWT_SECRET manquant');
    return res.redirect(302, `${frontendBase}/login?error=config`);
  }

  const redirectBase = `${frontendBase}/auth/callback`;
  const url = `${redirectBase}?token=${encodeURIComponent(token)}`;
  return res.redirect(302, url);
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select(
      'googleId email nom prenom photo role wilaya nomExploitation createdAt'
    );
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const ALLOWED_ROLES = ['agriculteur', 'conseiller', 'admin'];

exports.patchMe = async (req, res) => {
  try {
    const { role, wilaya, nomExploitation } = req.body || {};
    const update = {};

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
      }
      update.role = role;
    }
    if (wilaya !== undefined) {
      if (typeof wilaya !== 'string' || !wilaya.trim()) {
        return res.status(400).json({ error: 'Wilaya invalide' });
      }
      update.wilaya = wilaya.trim();
    }
    if (nomExploitation !== undefined) {
      const v = typeof nomExploitation === 'string' ? nomExploitation.trim().slice(0, 200) : '';
      update.nomExploitation = v;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    const user = await User.findByIdAndUpdate(req.auth.userId, { $set: update }, {
      new: true,
      runValidators: true,
    }).select('googleId email nom prenom photo role wilaya nomExploitation createdAt');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const token = issueJwt(user);
    if (!token) {
      return res.status(500).json({ error: 'Impossible d\'émettre un jeton' });
    }

    return res.json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
