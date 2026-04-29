import { useRef, useState } from "react";
import { X, Calendar, Sprout, Droplets, Leaf, Loader2, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./StatusBadge";
import { NdviChart } from "./NdviChart";
import { formatDate, formatHa, formatNumber, polygonAreaHa } from "./utils";
import type { ParcelleDetails } from "./types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

interface Props {
  details: ParcelleDetails | null;
  loading: boolean;
  onClose: () => void;
}

export const ParcelleDetailsPanel = ({ details, loading, onClose }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!details && !loading) return null;

  const ndviAvg = details?.analytics?.length
    ? details.analytics.reduce((s, d) => s + (d.ndvi ?? 0), 0) /
      details.analytics.filter((d) => d.ndvi != null).length
    : details?.info.ndviMoyen;
  const ndwiAvg = details?.analytics?.length
    ? details.analytics.reduce((s, d) => s + (d.ndwi ?? 0), 0) /
      details.analytics.filter((d) => d.ndwi != null).length
    : details?.info.ndwiMoyen;

  const surface = details?.info.surface ?? (details ? polygonAreaHa(details.info.geometry) : 0);

  const handleDownloadPdf = async () => {
    if (!details) return;
    try {
      setIsExporting(true);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`Rapport de Parcelle : ${details.info.nom}`, 14, 22);

      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 30);

      autoTable(pdf, {
        startY: 40,
        head: [['Propriété', 'Valeur']],
        body: [
          ['Nom de la parcelle', details.info.nom],
          ['Propriétaire', details.info.proprietaire],
          ['Date de création', formatDate(details.info.createdAt)],
          ['Type de culture', details.info.cultureType ?? "Non spécifié"],
          ['Surface estimée', formatHa(surface)],
          ['NDVI Moyen', formatNumber(ndviAvg, 3)],
          ['NDWI Moyen', formatNumber(ndwiAvg, 3)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      const chartElement = document.getElementById('pdf-chart-container');
      if (chartElement) {
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        
        const finalY = (pdf as any).lastAutoTable?.finalY || 100;
        
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Évolution Temporelle (6 derniers mois)", 14, finalY + 15);
        
        const pdfWidth = pdf.internal.pageSize.getWidth() - 28;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 14, finalY + 20, pdfWidth, pdfHeight);
      }

      pdf.save(`Rapport_${details.info.nom.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <aside className="absolute right-4 top-4 bottom-4 z-[500] flex w-[400px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-panel animate-fade-in-up">
      {loading && !details ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : details ? (
        <>
          <div ref={panelRef} className="flex h-full w-full flex-col bg-card">
            {/* Header */}
            <div className="relative bg-gradient-primary px-5 py-5 text-primary-foreground">
              <div className="absolute right-3 top-3 flex items-center gap-1 pdf-exclude">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  title="Télécharger le rapport PDF"
                  className="size-7 text-primary-foreground hover:bg-white/20"
                >
                  {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  className="size-7 text-primary-foreground hover:bg-white/20"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-90">
              <MapPin className="size-3.5" />
              Parcelle agricole
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{details.info.nom}</h2>
            <div className="mt-3">
              <StatusBadge
                ndvi={ndviAvg}
                size="sm"
                className="border-white/30 bg-white/20 text-white"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-5 p-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoTile
                  icon={<Calendar className="size-4" />}
                  label="Créée le"
                  value={formatDate(details.info.createdAt)}
                />
                <InfoTile
                  icon={<Sprout className="size-4" />}
                  label="Culture"
                  value={details.info.cultureType ?? "—"}
                />
                <InfoTile
                  icon={<MapPin className="size-4" />}
                  label="Surface"
                  value={formatHa(surface)}
                />
                <InfoTile
                  icon={<Sprout className="size-4" />}
                  label="Propriétaire"
                  value={details.info.proprietaire}
                />
              </div>

              <Separator />

              {/* Indices */}
              <div>
                <h3 className="mb-3 text-sm font-semibold tracking-tight">
                  Indices spectraux moyens
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <IndexCard
                    label="NDVI"
                    value={formatNumber(ndviAvg, 3)}
                    sub="Végétation"
                    icon={<Leaf className="size-4" />}
                    accent="ndvi"
                  />
                  <IndexCard
                    label="NDWI"
                    value={formatNumber(ndwiAvg, 3)}
                    sub="Eau / humidité"
                    icon={<Droplets className="size-4" />}
                    accent="ndwi"
                  />
                </div>
              </div>

              <Separator />

              {/* Chart */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Évolution temporelle
                  </h3>
                  <span className="text-xs text-muted-foreground">6 derniers mois</span>
                </div>
                <div id="pdf-chart-container" className="bg-card pb-2">
                  <NdviChart data={details.analytics ?? []} />
                </div>
              </div>

              {/* Interpretation */}
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                <strong className="font-medium text-foreground">Lecture :</strong> NDVI &gt; 0.6
                indique une végétation dense et saine. Entre 0.3 et 0.6, croissance modérée.
                En dessous de 0.3, la culture est probablement stressée (manque d&apos;eau,
                maladie, stade de levée).
              </div>
            </div>
          </ScrollArea>
          </div>
        </>
      ) : null}
    </aside>
  );
};

const InfoTile = ({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-background/50 p-3">
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
      {icon}
      {label}
    </div>
    <div className="mt-1 truncate text-sm font-medium text-foreground">{value}</div>
  </div>
);

const IndexCard = ({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode; accent: "ndvi" | "ndwi";
}) => (
  <div
    className={
      accent === "ndvi"
        ? "rounded-lg border border-ndvi/20 bg-ndvi/5 p-3"
        : "rounded-lg border border-ndwi/20 bg-ndwi/5 p-3"
    }
  >
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${accent === "ndvi" ? "text-ndvi" : "text-ndwi"}`}>
      {icon}
      {label}
    </div>
    <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
    <div className="text-[11px] text-muted-foreground">{sub}</div>
  </div>
);
