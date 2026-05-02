import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/features/parcelles/api";
import { isProfileComplete } from "@/lib/profile";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { token } = useAuth();

  useEffect(() => {
    const err = params.get("error");
    if (err === "google") {
      toast.error("Connexion Google refusée ou échouée.");
    } else if (err === "config") {
      toast.error("Authentification non configurée côté serveur.");
    }
  }, [params]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        if (isProfileComplete(me)) navigate("/", { replace: true });
        else navigate("/setup", { replace: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const startGoogle = () => {
    const url = new URL(`${API_BASE}/api/auth/google`);
    url.searchParams.set("frontend", window.location.origin);
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen bg-[#0b241a] text-emerald-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row md:items-stretch md:gap-12 md:px-8 md:py-14">
        {/* Colonne branding */}
        <div className="flex flex-1 flex-col justify-center md:max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl overflow-hidden">
              <img src="/logo.png" alt="AgriSpectra logo" className="size-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-50">AgriSpectra</h1>
              <p className="text-sm text-emerald-200/75">Surveillance agricole satellitaire</p>
            </div>
          </div>
          <p className="mt-8 text-3xl font-semibold leading-tight text-emerald-50 md:text-4xl">
            Bienvenue
          </p>
          <p className="mt-3 text-base leading-relaxed text-emerald-200/85">
            Connectez-vous pour accéder à vos parcelles et indices NDVI / NDWI.
          </p>
        </div>

        {/* Colonne formulaire */}
        <div className="flex flex-1 flex-col justify-center">
          <div className="rounded-2xl border border-emerald-900/60 bg-[#103325]/90 p-6 shadow-xl backdrop-blur md:p-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 w-full gap-3 border-emerald-700/50 bg-[#0f2f22] text-emerald-50 hover:bg-emerald-950/80 hover:text-emerald-50"
              onClick={startGoogle}
            >
              {/* Vrai logo Google SVG officiel */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continuer avec Google
              <ExternalLink className="size-4 opacity-70 ml-auto" />
            </Button>

            <div className="relative my-6">
              <Separator className="bg-emerald-900/50" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#103325] px-3 text-xs text-emerald-400/80">
                ou
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-emerald-200/90">Adresse e-mail</Label>
                <Input
                  disabled
                  readOnly
                  placeholder="agriculteur@exemple.dz"
                  className="border-emerald-900/50 bg-[#0a1f16]/80 text-emerald-200/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-emerald-200/90">Mot de passe</Label>
                <Input
                  disabled
                  readOnly
                  type="password"
                  placeholder="••••••••"
                  className="border-emerald-900/50 bg-[#0a1f16]/80 text-emerald-200/50"
                />
              </div>
            </div>

            <Alert className="mt-6 border-sky-500/30 bg-sky-950/25 text-sky-100 [&>svg]:text-sky-400">
              <Info className="size-4" />
              <AlertTitle className="text-sky-100">Connexion par e-mail désactivée</AlertTitle>
              <AlertDescription className="text-sky-200/85">
                Utilisez Google OAuth pour cette version — c&apos;est la seule méthode active et sécurisée
                pour votre compte.
              </AlertDescription>
            </Alert>

            <p className="mt-8 text-center text-xs leading-relaxed text-emerald-200/55">
              En continuant, vous acceptez les conditions d&apos;utilisation de la plateforme AgriSpectra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
