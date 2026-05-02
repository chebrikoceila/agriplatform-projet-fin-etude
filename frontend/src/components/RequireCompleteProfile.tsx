import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { authApi } from "@/features/parcelles/api";
import { isProfileComplete } from "@/lib/profile";

export const RequireCompleteProfile = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        if (!isProfileComplete(me)) {
          navigate("/setup", { replace: true });
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) navigate("/login", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">Chargement du profil…</p>
      </div>
    );
  }

  return <Outlet />;
};
