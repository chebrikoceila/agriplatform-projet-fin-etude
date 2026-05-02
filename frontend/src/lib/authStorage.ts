const TOKEN_KEY = "agrispectra_jwt";

export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
}

/** Décode le payload JWT (affichage client uniquement, sans vérification de signature). */
export const decodeJwtPayload = (token: string): JwtUserPayload | null => {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtUserPayload;
  } catch {
    return null;
  }
};
