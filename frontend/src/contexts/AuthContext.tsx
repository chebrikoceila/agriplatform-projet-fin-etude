import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  clearAccessToken,
  decodeJwtPayload,
  getAccessToken,
  setAccessToken,
  type JwtUserPayload,
} from "@/lib/authStorage";

type AuthContextValue = {
  token: string | null;
  user: JwtUserPayload | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => getAccessToken());

  const user = useMemo(() => (token ? decodeJwtPayload(token) : null), [token]);

  const setToken = useCallback((next: string | null) => {
    if (next) {
      setAccessToken(next);
      setTokenState(next);
    } else {
      clearAccessToken();
      setTokenState(null);
    }
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, setToken, logout }),
    [token, user, setToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
