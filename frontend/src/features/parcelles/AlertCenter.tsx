import { useEffect, useState } from "react";
import { ArrowLeft, BellRing, CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { alertsApi } from "./api";
import { subscribeToPushNotifications } from "./pushNotifications";
import type { AlertItem } from "./types";
import { useNavigate } from "react-router-dom";

const alertToneClass: Record<AlertItem["type"], string> = {
  "Stress Hydrique": "border-l-4 border-l-amber-500",
  "Santé": "border-l-4 border-l-red-600",
  "Mise à jour": "border-l-4 border-l-emerald-600",
};

export const AlertCenter = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertsApi.list();
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const markRead = async (id: string) => {
    const updated = await alertsApi.markRead(id);
    setAlerts((prev) => prev.map((a) => (a._id === id ? updated : a)));
  };

  const deleteAlert = async (id: string) => {
    await alertsApi.remove(id);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    toast.success("Alerte supprimée.");
  };

  const clearReadAlerts = async () => {
    const result = await alertsApi.clearRead();
    setAlerts((prev) => prev.filter((a) => !a.isRead));
    toast.success(`${result.deletedCount} alerte(s) lue(s) supprimée(s).`);
  };

  const clearAllAlerts = async () => {
    const result = await alertsApi.clearAll();
    setAlerts([]);
    toast.success(`${result.deletedCount} alerte(s) supprimée(s).`);
  };

  const enablePush = async () => {
    setSubscribing(true);
    try {
      await subscribeToPushNotifications();
      toast.success("Notifications push activées.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'activer les notifications push.";
      toast.error("Activation échouée", { description: message });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div className="flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2 text-foreground hover:text-primary">
          <BellRing className="size-5" />
          <span className="text-lg font-semibold">AgriSelect</span>
        </a>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            Retour
          </Button>
          <Button variant="outline" onClick={loadAlerts}>
            <RefreshCw className="mr-2 size-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BellRing className="size-5" />
            Centre d'alertes agronomiques
          </CardTitle>
          <Button onClick={enablePush} disabled={subscribing}>
            Activer les notifications push
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={clearReadAlerts}>
            <Trash2 className="mr-2 size-4" />
            Supprimer les alertes lues
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllAlerts}>
            <Trash2 className="mr-2 size-4" />
            Tout supprimer
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement des alertes...</p>}
        {!loading && alerts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Aucune alerte pour le moment.</CardContent>
          </Card>
        )}
        {!loading &&
          alerts.map((alert) => (
            <Card key={alert._id} className={alertToneClass[alert.type]}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-foreground">{alert.parcelleId?.nom || "Parcelle"}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.type} · indice {alert.valeurIndice.toFixed(2)} · {new Date(alert.date).toLocaleString()}
                  </p>
                  {alert.rapport && (
                    <p className="mt-1 text-sm text-foreground/80">{alert.rapport}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!alert.isRead && (
                    <Button variant="outline" size="sm" onClick={() => markRead(alert._id)}>
                      <CheckCheck className="mr-2 size-4" />
                      Marquer comme lue
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => deleteAlert(alert._id)}>
                    <Trash2 className="mr-2 size-4" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};
