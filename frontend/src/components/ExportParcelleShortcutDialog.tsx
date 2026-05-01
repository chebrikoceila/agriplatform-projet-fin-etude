import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { parcellesApi } from "@/features/parcelles/api";
import { NdviChart } from "@/features/parcelles/NdviChart";
import type { Parcelle, ParcelleDetails } from "@/features/parcelles/types";
import {
  downloadParcelleCsv,
  downloadParcellePdf,
  SHORTCUT_PDF_CHART_ID,
} from "@/features/parcelles/exportReports";

type ExportMode = "pdf" | "csv";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ExportMode | null;
}

export const ExportParcelleShortcutDialog = ({ open, onOpenChange, mode }: Props) => {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pdfStaging, setPdfStaging] = useState<ParcelleDetails | null>(null);

  useEffect(() => {
    if (!open || !mode) return;
    let cancelled = false;
    setListLoading(true);
    parcellesApi
      .list()
      .then((data) => {
        if (!cancelled) setParcelles(data);
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Impossible de charger les parcelles.";
        toast.error("Erreur", { description: message });
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mode]);

  useEffect(() => {
    if (!pdfStaging || mode !== "pdf") return;
    let cancelled = false;

    const run = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise((r) => setTimeout(r, 650));
      if (cancelled) return;
      try {
        await downloadParcellePdf(pdfStaging, SHORTCUT_PDF_CHART_ID);
        if (!cancelled) {
          toast.success("Rapport PDF téléchargé");
          onOpenChange(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Échec du PDF", {
            description: e instanceof Error ? e.message : "Erreur inconnue",
          });
        }
      } finally {
        if (!cancelled) setPdfStaging(null);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [pdfStaging, mode, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setPdfStaging(null);
      setBusyId(null);
    }
  }, [open]);

  const title = mode === "pdf" ? "Rapport PDF" : "Export CSV";
  const Icon = mode === "pdf" ? FileText : FileSpreadsheet;

  const handlePick = async (id: string) => {
    if (!mode || busyId) return;
    setBusyId(id);
    try {
      const details = await parcellesApi.get(id);
      if (mode === "csv") {
        const ok = downloadParcelleCsv(details);
        if (ok) toast.success("CSV téléchargé");
        else
          toast.info("Aucune série temporelle", {
            description: "Pas de données NDVI/NDWI à exporter pour cette parcelle.",
          });
        onOpenChange(false);
      } else {
        setPdfStaging(details);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "")
          : err instanceof Error
            ? err.message
            : "Chargement impossible.";
      toast.error("Erreur", { description: message || "Chargement impossible." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {pdfStaging ? (
        <div
          className="pointer-events-none fixed left-[-14000px] top-0 z-0 w-[440px] bg-white p-4 shadow-none"
          aria-hidden
        >
          <div id={SHORTCUT_PDF_CHART_ID} className="bg-white pb-2">
            <NdviChart data={pdfStaging.analytics ?? []} />
          </div>
        </div>
      ) : null}

      <Dialog open={open && !!mode} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] gap-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="size-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              Choisissez une parcelle : le fichier se télécharge tout de suite.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {listLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : parcelles.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune parcelle enregistrée. Créez-en une depuis la page Parcelles.
              </p>
            ) : (
              <ScrollArea className="h-[min(360px,50vh)] pr-3">
                <ul className="space-y-1">
                  {parcelles.map((p) => (
                    <li key={p._id}>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start gap-2 px-3 py-3 text-left font-normal"
                        disabled={!!busyId || !!pdfStaging}
                        onClick={() => void handlePick(p._id)}
                      >
                        {busyId === p._id ? (
                          <Loader2 className="size-4 shrink-0 animate-spin" />
                        ) : (
                          <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{p.nom}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
