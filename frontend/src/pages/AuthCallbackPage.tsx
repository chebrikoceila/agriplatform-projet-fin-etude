import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/features/parcelles/api";
import { isProfileComplete } from "@/lib/profile";

const AuthCallbackPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      toast.error("Échec de la connexion.");
      navigate("/login", { replace: true });
      return;
    }

    if (!token) {
      toast.error("Jeton manquant.");
      navigate("/login", { replace: true });
      return;
    }

    ran.current = true;
    setToken(token);

    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (cancelled) return;
        toast.success("Connexion réussie");
        if (!isProfileComplete(me)) {
          navigate("/setup", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch {
        if (!cancelled) {
          toast.error("Impossible de valider la session.");
          navigate("/login", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, setToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0b241a] text-emerald-200/80">
      <Loader2 className="size-8 animate-spin text-emerald-400" />
      <p className="text-sm">Finalisation de la connexion…</p>
    </div>
  );
};

export default AuthCallbackPage;
