import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2, Sprout, UserRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi } from "@/features/parcelles/api";
import { useAuth } from "@/contexts/AuthContext";
import { ALGERIA_WILAYAS } from "@/data/wilayas";
import { isProfileComplete } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const oauthSteps = [
  { ok: true, label: "/api/auth/google → Google" },
  { ok: true, label: "Consentement utilisateur" },
  { ok: true, label: "Callback → upsert MongoDB" },
  { ok: true, label: "JWT signé → redirect frontend" },
];

const SetupPage = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wilaya, setWilaya] = useState("");
  const [nomExploitation, setNomExploitation] = useState("");

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        if (isProfileComplete(me)) {
          navigate("/", { replace: true });
          return;
        }
        if (me.wilaya) setWilaya(me.wilaya);
        setNomExploitation(me.nomExploitation ?? "");
      })
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wilaya.trim()) {
      toast.error("Choisissez une wilaya.");
      return;
    }
    setSubmitting(true);
    try {
      const { user, token } = await authApi.patchProfile({
        role: "agriculteur",
        wilaya: wilaya.trim(),
        nomExploitation: nomExploitation.trim() || undefined,
      });
      setToken(token);
      toast.success("Profil complété");
      if (isProfileComplete(user)) navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "")
          : "Erreur lors de l’enregistrement.";
      toast.error(msg || "Erreur lors de l’enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b241a] text-emerald-50">
        <Loader2 className="size-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b241a] px-4 py-10 text-emerald-50">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="text-center">
          <img src="/logo.png" alt="" className="mx-auto mb-3 h-12 w-12 object-contain" />
          <h1 className="text-xl font-semibold tracking-tight">Finaliser votre compte</h1>
          <p className="mt-1 text-sm text-emerald-200/80">
            Après connexion — sélection du rôle et informations complémentaires
          </p>
        </div>

        <Card className="border-emerald-900/60 bg-[#103325]/90 text-emerald-50 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-50">Sélection du rôle</CardTitle>
            <CardDescription className="text-emerald-200/70">
              Choisissez votre profil (interface conseiller à venir).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={cn(
                "flex flex-col items-start rounded-lg border p-4 text-left transition-colors",
                "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50"
              )}
            >
              <Sprout className="mb-2 size-5 text-emerald-400" />
              <span className="font-semibold">Agriculteur</span>
              <span className="text-xs text-emerald-200/70">Gérer mes parcelles</span>
            </button>
            <button
              type="button"
              disabled
              className="relative flex cursor-not-allowed flex-col items-start rounded-lg border border-emerald-900/40 bg-[#0a1f16]/80 p-4 text-left opacity-60"
            >
              <Badge
                variant="secondary"
                className="absolute right-2 top-2 border-emerald-800 bg-emerald-950 text-[10px] text-emerald-300"
              >
                Bientôt
              </Badge>
              <UserRound className="mb-2 size-5 text-emerald-600" />
              <span className="font-semibold">Conseiller</span>
              <span className="text-xs text-emerald-200/50">Suivre des exploitations</span>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-amber-200/80">
                <Lock className="size-3" />
                Interface dédiée plus tard
              </span>
            </button>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/60 bg-[#103325]/90 text-emerald-50 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-50">Informations complémentaires</CardTitle>
            <CardDescription className="text-emerald-200/70">
              Ces données sont enregistrées sur votre profil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="wilaya">Wilaya</Label>
                <Select value={wilaya} onValueChange={setWilaya}>
                  <SelectTrigger id="wilaya" className="border-emerald-900/60 bg-[#0f2f22] text-emerald-50">
                    <SelectValue placeholder="Choisir une wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 border-emerald-900 bg-[#103325] text-emerald-50">
                    {ALGERIA_WILAYAS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="farm">Nom de l&apos;exploitation (optionnel)</Label>
                <Input
                  id="farm"
                  value={nomExploitation}
                  onChange={(e) => setNomExploitation(e.target.value)}
                  placeholder="ex: Ferme El Baraka"
                  className="border-emerald-900/60 bg-[#0f2f22] text-emerald-50 placeholder:text-emerald-200/40"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
                size="lg"
                disabled={submitting || !wilaya.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Terminer la configuration"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/50 bg-[#0f2f22]/60 text-emerald-100/90">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <UserRound className="size-4" />
              Flux OAuth 2.0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs text-emerald-200/85">
              {oauthSteps.map((step) => (
                <li key={step.label} className="flex items-center gap-2">
                  <Check className="size-3.5 shrink-0 text-emerald-400" />
                  {step.label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupPage;
