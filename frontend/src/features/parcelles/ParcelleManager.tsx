import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ParcelleSidebar } from "./ParcelleSidebar";
import { ParcelleMap } from "./ParcelleMap";
import { ParcelleDetailsPanel } from "./ParcelleDetailsPanel";
import { CreateParcelleDialog } from "./CreateParcelleDialog";
import { EditParcelleDialog } from "./EditParcelleDialog";
import { parcellesApi } from "./api";
import type { Parcelle, ParcelleDetails, ParcelleGeometry } from "./types";
import { polygonAreaHa } from "./utils";

export const ParcelleManager = () => {
  const navigate = useNavigate();
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<ParcelleDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [drawing, setDrawing] = useState(false);
  const [pendingGeom, setPendingGeom] = useState<ParcelleGeometry | null>(null);
  const [editingParcelle, setEditingParcelle] = useState<Parcelle | null>(null);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await parcellesApi.list();
      setParcelles(data);
    } catch (err: any) {
      toast.error("Impossible de charger les parcelles", {
        description: err?.message ?? "Vérifiez la connexion au backend.",
      });
    } finally {
      setLoadingList(false);
    }
  }, []);

  const handleShowList = () => {
    setShowList(true);
    fetchList();
  };

  // Load details on select
  useEffect(() => {
    if (!selectedId) { setDetails(null); return; }
    let cancelled = false;
    setLoadingDetails(true);
    parcellesApi.get(selectedId)
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch((err) => {
        if (!cancelled) toast.error("Erreur de chargement", { description: err?.message });
      })
      .finally(() => { if (!cancelled) setLoadingDetails(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleCreated = (geom: ParcelleGeometry) => {
    setDrawing(false);
    setPendingGeom(geom);
  };

  const handleConfirmCreate = async (data: { nom: string; cultureType: string; proprietaire: string; datePlantation: string }) => {
    if (!pendingGeom) return;
    try {
      const surface = polygonAreaHa(pendingGeom);
      const res = await parcellesApi.create({
        ...data,
        surface,
        geometry: pendingGeom,
      });
      toast.success("Parcelle créée", { description: "Calcul NDVI / NDWI lancé." });
      setPendingGeom(null);
      if (showList) await fetchList();
      if (res?.info?._id) setSelectedId(res.info._id);
    } catch (err: any) {
      toast.error("Création impossible", { description: err?.response?.data?.error ?? err?.message });
    }
  };

  const handleEdit = async (id: string, data: Partial<Parcelle>) => {
    try {
      await parcellesApi.update(id, data);
      toast.success("Parcelle modifiée");
      setParcelles((prev) => prev.map((p) => (p._id === id ? { ...p, ...data } : p)));
      if (details?.info._id === id) setDetails({ ...details, info: { ...details.info, ...data } });
    } catch (err: any) {
      toast.error("Modification impossible", { description: err?.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await parcellesApi.remove(id);
      toast.success("Parcelle supprimée");
      setParcelles((prev) => prev.filter((p) => p._id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      toast.error("Suppression impossible", { description: err?.message });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ParcelleSidebar
        parcelles={parcelles}
        loading={loadingList}
        selectedId={selectedId}
        drawing={drawing}
        onSelect={setSelectedId}
        onStartDraw={() => setDrawing(true)}
        onCancelDraw={() => setDrawing(false)}
        onRefresh={handleShowList}
        onOpenAlerts={() => navigate("/alertes")}
        showList={showList}
        onEdit={(p) => setEditingParcelle(p)}
        onDelete={handleDelete}
      />

      <main className="relative flex-1">
        <ParcelleMap
          parcelles={parcelles}
          selectedId={selectedId}
          onSelect={setSelectedId}
          drawing={drawing}
          onCreated={handleCreated}
        />

        {/* Top status overlay */}
        <div className="pointer-events-none absolute left-4 top-4 z-[500] flex items-center gap-2">
          <div className="pointer-events-auto rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            Sentinel-2 · imagerie satellite
          </div>
          {drawing && (
            <div className="pointer-events-auto rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary shadow-soft backdrop-blur">
              Mode dessin actif
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-4 z-[500] rounded-lg border border-border bg-card/95 p-3 text-xs shadow-panel backdrop-blur">
          <div className="mb-2 font-semibold text-foreground">État de la végétation</div>
          <div className="space-y-1.5">
            <LegendItem color="bg-status-good" label="NDVI > 0.6 — Bonne récolte" />
            <LegendItem color="bg-status-medium" label="0.3 – 0.6 — Moyenne" />
            <LegendItem color="bg-status-stressed" label="< 0.3 — Stressée" />
          </div>
        </div>

        {selectedId && (
          <ParcelleDetailsPanel
            details={details}
            loading={loadingDetails}
            onClose={() => setSelectedId(null)}
          />
        )}
      </main>

      <CreateParcelleDialog
        open={!!pendingGeom}
        geometry={pendingGeom}
        onCancel={() => setPendingGeom(null)}
        onConfirm={handleConfirmCreate}
      />

      <EditParcelleDialog
        open={!!editingParcelle}
        parcelle={editingParcelle}
        onCancel={() => setEditingParcelle(null)}
        onConfirm={handleEdit}
      />
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <span className={`size-2.5 rounded-sm ${color}`} />
    {label}
  </div>
);
