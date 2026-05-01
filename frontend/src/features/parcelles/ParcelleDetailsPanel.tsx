import { useRef, useState } from "react";
import {
  X,
  Calendar,
  Sprout,
  Droplets,
  Leaf,
  Loader2,
  MapPin,
  Download,
  Camera,
  FileSpreadsheet,
  CloudRain,
  Wind,
  ThermometerSun,
  CloudSun,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./StatusBadge";
import { NdviChart } from "./NdviChart";
import { formatDate, formatHa, formatNumber, polygonAreaHa } from "./utils";
import type { ParcelleDetails, ParcelleMeteo } from "./types";
import { downloadParcelleCsv, downloadParcellePdf, PANEL_PDF_CHART_ID } from "./exportReports";

interface Props {
  details: ParcelleDetails | null;
  loading: boolean;
  onClose: () => void;
  meteo?: ParcelleMeteo | null;
}

const getWeatherIcon = (precipMm: number | null | undefined, tempMax: number | null | undefined) => {
  if ((precipMm ?? 0) >= 2) return <CloudRain className="size-3.5 text-sky-600" />;
  if ((tempMax ?? 0) >= 32) return <ThermometerSun className="size-3.5 text-amber-500" />;
  return <CloudSun className="size-3.5 text-emerald-600" />;
};

export const ParcelleDetailsPanel = ({ details, loading, onClose, meteo }: Props) => {
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
  const periodText = details?.info.datePlantation 
    ? `Depuis le ${formatDate(details.info.datePlantation)}` 
    : "6 derniers mois";

  const lastCaptureDate = details?.analytics?.length
    ? details.analytics[details.analytics.length - 1].date
    : details?.latestSentinelImageDate
      ?? details?.info.lastAnalyzedCaptureDate
      ?? null;

  const handleDownloadPdf = async () => {
    if (!details) return;
    try {
      setIsExporting(true);
      await downloadParcellePdf(details, PANEL_PDF_CHART_ID);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    if (!details) return;
    downloadParcelleCsv(details);
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
                  onClick={handleExportCsv}
                  disabled={!details?.analytics?.length || isExporting}
                  title="Exporter la série temporelle en CSV"
                  className="size-7 text-primary-foreground hover:bg-white/20"
                >
                  <FileSpreadsheet className="size-4" />
                </Button>
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
                <InfoTile
                  icon={<Camera className="size-4" />}
                  label="Dernière Image S2"
                  value={lastCaptureDate ? formatDate(lastCaptureDate) : "—"}
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

              <div>
                <h3 className="mb-3 text-sm font-semibold tracking-tight">Météo opérationnelle</h3>
                {meteo ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoTile
                        icon={<CloudRain className="size-4 text-sky-600" />}
                        label="Pluie 7 jours"
                        value={`${meteo.rainfallLast7DaysMm.toFixed(1)} mm`}
                      />
                      <InfoTile
                        icon={<ThermometerSun className="size-4 text-amber-500" />}
                        label="ETP (jour)"
                        value={meteo.currentDay?.etp != null ? `${meteo.currentDay.etp.toFixed(1)} mm/j` : "—"}
                      />
                      <InfoTile
                        icon={<Waves className="size-4 text-cyan-600" />}
                        label="Humidité (jour)"
                        value={meteo.currentDay?.humidity != null ? `${meteo.currentDay.humidity.toFixed(0)} %` : "—"}
                      />
                      <InfoTile
                        icon={<Wind className="size-4 text-slate-600" />}
                        label="Vent (jour)"
                        value={
                          meteo.currentDay?.windSpeed != null
                            ? `${meteo.currentDay.windSpeed.toFixed(1)} km/h ${meteo.currentDay.windDirection ?? ""}`.trim()
                            : "—"
                        }
                      />
                    </div>
                    <div className="rounded-lg border border-border bg-gradient-to-br from-background via-background to-sky-50/60 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Températures min/max (J0 + 5 jours)
                      </p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {[meteo.currentDay, ...meteo.next5Days].filter(Boolean).map((day) => (
                          <div key={day!.date} className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              {getWeatherIcon(day!.precipMm, day!.tempMax)}
                              {formatDate(day!.date)}
                            </span>
                            <span className="font-medium text-foreground">
                              {day!.tempMin != null ? `${day!.tempMin.toFixed(1)}°` : "—"} / {day!.tempMax != null ? `${day!.tempMax.toFixed(1)}°` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Données météo indisponibles pour le moment.</p>
                )}
              </div>

              <Separator />

              {/* Chart */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Évolution temporelle
                  </h3>
                  <span className="text-xs text-muted-foreground">{periodText}</span>
                </div>
                <div id={PANEL_PDF_CHART_ID} className="bg-card pb-2">
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
