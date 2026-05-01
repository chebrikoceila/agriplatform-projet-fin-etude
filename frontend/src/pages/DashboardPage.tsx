import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Polygon, TileLayer, ZoomControl } from "react-leaflet";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import { Droplets, Leaf, Siren, Sprout } from "lucide-react";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHa, formatNumber } from "@/features/parcelles/utils";
import { alertsApi, dashboardApi, getParcelleSeries, parcellesApi, type DashboardStats } from "@/features/parcelles/api";
import type { AlertItem, AnalyticsPoint, Parcelle } from "@/features/parcelles/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const getNdviColor = (ndvi?: number | null) => {
  if (ndvi == null || Number.isNaN(ndvi)) return "#64748b";
  if (ndvi > 0.6) return "#16a34a";
  if (ndvi >= 0.3) return "#eab308";
  return "#dc2626";
};

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedParcelleId, setSelectedParcelleId] = useState<string | null>(null);
  const [series, setSeries] = useState<AnalyticsPoint[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [parcellesLoading, setParcellesLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [parcellesError, setParcellesError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return { debut: formatDateInput(start), fin: formatDateInput(end) };
  });

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    dashboardApi
      .stats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((error: any) => {
        if (!cancelled) setStatsError(error?.response?.data?.error ?? "Erreur lors du chargement des KPI.");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setParcellesLoading(true);
    setParcellesError(null);
    parcellesApi
      .list()
      .then((data) => {
        if (!cancelled) {
          setParcelles(data);
          if (!selectedParcelleId && data.length) {
            setSelectedParcelleId(data[0]._id);
          }
        }
      })
      .catch((error: any) => {
        if (!cancelled) setParcellesError(error?.response?.data?.error ?? "Impossible de charger les parcelles.");
      })
      .finally(() => {
        if (!cancelled) setParcellesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedParcelleId]);

  useEffect(() => {
    let cancelled = false;
    setAlertsLoading(true);
    setAlertsError(null);
    alertsApi
      .list({ limit: 5, statut: "active" })
      .then((data) => {
        if (!cancelled) setAlerts(data);
      })
      .catch((error: any) => {
        if (!cancelled) setAlertsError(error?.response?.data?.error ?? "Impossible de charger les alertes actives.");
      })
      .finally(() => {
        if (!cancelled) setAlertsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedParcelleId) return;
    let cancelled = false;
    setSeriesLoading(true);
    setSeriesError(null);
    getParcelleSeries(selectedParcelleId, dateRange.debut, dateRange.fin)
      .then((data) => {
        if (!cancelled) setSeries(data);
      })
      .catch((error: any) => {
        if (!cancelled) setSeriesError(error?.response?.data?.error ?? "Erreur lors du chargement de la série temporelle.");
      })
      .finally(() => {
        if (!cancelled) setSeriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedParcelleId, dateRange.debut, dateRange.fin]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (!parcelles.length) return [31.7917, -7.0926];
    const coords = parcelles.flatMap((p) => p.geometry.coordinates?.[0] ?? []);
    if (!coords.length) return [31.7917, -7.0926];
    const [sumLng, sumLat] = coords.reduce<[number, number]>(
      (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
      [0, 0]
    );
    return [sumLat / coords.length, sumLng / coords.length];
  }, [parcelles]);

  const chartData = useMemo(
    () => ({
      labels: series.map((point) => point.date),
      datasets: [
        {
          label: "NDVI",
          data: series.map((point) => point.ndvi),
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.2)",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.2,
        },
        {
          label: "NDWI",
          data: series.map((point) => point.ndwi),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.2)",
          borderDash: [8, 4],
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.2,
        },
      ],
    }),
    [series]
  );

  const panelClass = "border border-emerald-900/70 bg-[#0f2f22]/85 text-emerald-50 shadow-lg";
  const softTextClass = "text-emerald-100/80";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PlatformSidebar />
      <main className="flex-1 space-y-6 overflow-auto bg-[radial-gradient(circle_at_top,#184c35_0%,#103325_45%,#0b241a_100%)] p-6 text-emerald-50">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Parcelles actives"
            icon={<Sprout className="size-4 text-primary" />}
            value={statsLoading ? null : `${stats?.activeParcelles ?? 0}`}
            loading={statsLoading}
            error={statsError}
            className={panelClass}
            softTextClass={softTextClass}
          />
          <KpiCard
            title="NDVI moyen global"
            icon={<Leaf className="size-4 text-emerald-600" />}
            value={statsLoading ? null : formatNumber(stats?.ndviGlobalAvg, 3)}
            loading={statsLoading}
            error={statsError}
            className={panelClass}
            softTextClass={softTextClass}
          />
          <KpiCard
            title="Stress hydrique (NDWI)"
            icon={<Droplets className="size-4 text-blue-600" />}
            value={statsLoading ? null : `${stats?.stressHydriqueCount ?? 0}`}
            loading={statsLoading}
            error={statsError}
            className={panelClass}
            softTextClass={softTextClass}
          />
          <KpiCard
            title="Alertes actives"
            icon={<Siren className="size-4 text-amber-600" />}
            value={statsLoading ? null : `${stats?.activeAlertsCount ?? 0}`}
            loading={statsLoading}
            error={statsError}
            className={panelClass}
            softTextClass={softTextClass}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className={`xl:col-span-2 ${panelClass}`}>
            <CardHeader>
              <CardTitle>Carte des parcelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parcellesLoading ? (
                <Skeleton className="h-[360px] w-full" />
              ) : parcellesError ? (
                <p className="text-sm text-destructive">{parcellesError}</p>
              ) : (
                <>
                  <div className="h-[360px] overflow-hidden rounded-md border">
                    <MapContainer center={mapCenter} zoom={8} className="h-full w-full" zoomControl={false}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <ZoomControl position="bottomright" />
                      {parcelles.map((parcelle) => (
                        <Polygon
                          key={parcelle._id}
                          positions={(parcelle.geometry.coordinates[0] ?? []).map((coord) => [coord[1], coord[0]])}
                          pathOptions={{
                            color: getNdviColor(parcelle.ndviMoyen),
                            fillColor: getNdviColor(parcelle.ndviMoyen),
                            fillOpacity: 0.35,
                            weight: selectedParcelleId === parcelle._id ? 3 : 2,
                          }}
                          eventHandlers={{ click: () => setSelectedParcelleId(parcelle._id) }}
                        />
                      ))}
                    </MapContainer>
                  </div>
                  <div className={`flex flex-wrap gap-4 text-xs ${softTextClass}`}>
                    <LegendDot color="#16a34a" label="NDVI > 0.6" />
                    <LegendDot color="#eab308" label="NDVI 0.3 - 0.6" />
                    <LegendDot color="#dc2626" label="NDVI < 0.3" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle>5 dernières alertes actives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertsLoading && (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              )}
              {!alertsLoading && alertsError && <p className="text-sm text-destructive">{alertsError}</p>}
              {!alertsLoading && !alertsError && alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune alerte active.</p>
              )}
              {!alertsLoading &&
                !alertsError &&
                alerts.map((alert) => {
                  const critical = alert.type === "Santé";
                  const label = alert.rapport?.toLowerCase().includes("hausse")
                    || alert.rapport?.toLowerCase().includes("baisse")
                    ? "Variation rapide"
                    : "Seuil absolu";
                  return (
                    <div key={alert._id} className={`rounded-md border px-3 py-2 ${critical ? "border-red-500/70 bg-red-950/30" : "border-amber-500/70 bg-amber-950/30"}`}>
                      <p className="text-sm font-medium">{alert.parcelleId?.nom ?? "Parcelle"}</p>
                      <p className={`text-xs ${softTextClass}`}>
                        {alert.type} · {label} · {formatNumber(alert.valeurIndice, 3)}
                      </p>
                      <p className={`text-xs ${softTextClass}`}>{new Date(alert.date).toLocaleString("fr-FR")}</p>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className={`xl:col-span-2 ${panelClass}`}>
            <CardHeader className="gap-3">
              <CardTitle>Série temporelle NDVI / NDWI</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <label className={`text-xs ${softTextClass}`}>Parcelle</label>
                <select
                  className="rounded-md border border-emerald-700 bg-emerald-950/40 px-2 py-1 text-sm text-emerald-50"
                  value={selectedParcelleId ?? ""}
                  onChange={(event) => setSelectedParcelleId(event.target.value)}
                >
                  {parcelles.map((parcelle) => (
                    <option key={parcelle._id} value={parcelle._id}>
                      {parcelle.nom}
                    </option>
                  ))}
                </select>
                <label className={`ml-2 text-xs ${softTextClass}`}>Début</label>
                <input
                  type="date"
                  className="rounded-md border border-emerald-700 bg-emerald-950/40 px-2 py-1 text-sm text-emerald-50"
                  value={dateRange.debut}
                  onChange={(event) => setDateRange((prev) => ({ ...prev, debut: event.target.value }))}
                />
                <label className={`text-xs ${softTextClass}`}>Fin</label>
                <input
                  type="date"
                  className="rounded-md border border-emerald-700 bg-emerald-950/40 px-2 py-1 text-sm text-emerald-50"
                  value={dateRange.fin}
                  onChange={(event) => setDateRange((prev) => ({ ...prev, fin: event.target.value }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              {seriesLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : seriesError ? (
                <p className="text-sm text-destructive">{seriesError}</p>
              ) : !series.length ? (
                <p className="text-sm text-muted-foreground">Pas de données de série temporelle sur la période.</p>
              ) : (
                <div className="h-[280px]">
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { min: 0, max: 1, title: { display: true, text: "Indice" } },
                        x: { title: { display: true, text: "Date" } },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader>
              <CardTitle>Table des parcelles</CardTitle>
            </CardHeader>
            <CardContent>
              {parcellesLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : parcellesError ? (
                <p className="text-sm text-destructive">{parcellesError}</p>
              ) : (
                <Table className="text-emerald-50">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={softTextClass}>Nom</TableHead>
                      <TableHead className={softTextClass}>Surface</TableHead>
                      <TableHead className={softTextClass}>NDVI</TableHead>
                      <TableHead className={softTextClass}>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelles.map((parcelle) => (
                      <TableRow
                        key={parcelle._id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/parcelles/${parcelle._id}`)}
                      >
                        <TableCell>{parcelle.nom}</TableCell>
                        <TableCell>{formatHa(parcelle.surface ?? 0)}</TableCell>
                        <TableCell>{formatNumber(parcelle.ndviMoyen, 3)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              parcelle.status === "critical"
                                ? "border-red-500 text-red-300"
                                : parcelle.status === "warning"
                                  ? "border-amber-500 text-amber-300"
                                  : "border-emerald-500 text-emerald-300"
                            }
                          >
                            {parcelle.status ?? "ok"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

const KpiCard = ({
  title,
  icon,
  value,
  loading,
  error,
  className,
  softTextClass,
}: {
  title: string;
  icon: ReactNode;
  value: string | null;
  loading: boolean;
  error: string | null;
  className?: string;
  softTextClass?: string;
}) => (
  <Card className={className}>
    <CardHeader className="pb-2">
      <CardTitle className={`flex items-center gap-2 text-sm font-medium ${softTextClass ?? "text-muted-foreground"}`}>
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-2xl font-bold">{value ?? "—"}</p>
      )}
    </CardContent>
  </Card>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: color }} />
    {label}
  </div>
);

export default DashboardPage;
