const jwt = require('jsonwebtoken');

/**
 * Vérifie Authorization: Bearer <JWT> et attache req.auth = { userId, email, role }.
 */
const authJwt = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[auth] JWT_SECRET non défini');
    return res.status(500).json({ error: 'Configuration serveur invalide' });
  }

  try {
    const payload = jwt.verify(token, secret);
    const { userId, email, role } = payload;
    if (!userId || !email) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.auth = { userId, email, role };
    next();
  } catch {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
};

module.exports = authJwt;
