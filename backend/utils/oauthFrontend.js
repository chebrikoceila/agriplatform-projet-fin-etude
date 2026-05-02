const { URL } = require('url');

const getDefaultFrontend = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173';
  return raw.replace(/\/$/, '');
};

/**
 * Origines autorisées pour la redirection post-OAuth (évite les open redirects).
 * - localhost / 127.0.0.1 (n’importe quel port) en dev
 * - même origine que FRONTEND_URL si défini
 * - liste optionnelle FRONTEND_ORIGINS_ALLOWLIST (origines séparées par des virgules)
 */
function isAllowedFrontendOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const hostname = u.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

    if (process.env.FRONTEND_URL) {
      const allowed = new URL(process.env.FRONTEND_URL);
      if (u.origin === allowed.origin) return true;
    }

    const allowlist = process.env.FRONTEND_ORIGINS_ALLOWLIST;
    if (allowlist) {
      for (const item of allowlist.split(',').map((s) => s.trim()).filter(Boolean)) {
        try {
          if (new URL(item).origin === u.origin) return true;
        } catch {
          /* ignore */
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

function normalizeOrigin(input) {
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

/** Encode l’origine du front dans le paramètre state (renvoyé tel quel par Google). */
function encodeOAuthState(frontendOrigin) {
  const payload = JSON.stringify({ f: frontendOrigin });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

/** Décode et valide le state ; retourne l’origine sans slash final, ou null. */
function decodeOAuthState(stateParam) {
  if (!stateParam || typeof stateParam !== 'string') return null;
  try {
    const json = Buffer.from(stateParam, 'base64url').toString('utf8');
    const obj = JSON.parse(json);
    if (!obj || typeof obj.f !== 'string') return null;
    const origin = normalizeOrigin(obj.f);
    if (!origin || !isAllowedFrontendOrigin(origin)) return null;
    return origin.replace(/\/$/, '');
  } catch {
    return null;
  }
}

/** À partir du query ?frontend= sur GET /google */
function resolveFrontendFromLoginQuery(queryFrontend) {
  if (!queryFrontend || typeof queryFrontend !== 'string') {
    return getDefaultFrontend();
  }
  const origin = normalizeOrigin(queryFrontend);
  if (!origin || !isAllowedFrontendOrigin(origin)) {
    return getDefaultFrontend();
  }
  return origin.replace(/\/$/, '');
}

module.exports = {
  getDefaultFrontend,
  encodeOAuthState,
  decodeOAuthState,
  resolveFrontendFromLoginQuery,
};
