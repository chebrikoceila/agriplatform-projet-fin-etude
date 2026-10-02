import { useEffect, useState, type ReactNode } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Droplets, Sprout, Siren, Activity, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { PlatformSidebar } from "@/components/PlatformSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi, parcellesApi, getParcelleSeries, type DashboardStats } from "@/features/parcelles/api";
import type { Parcelle, AnalyticsPoint } from "@/features/parcelles/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface SerieData { date: string; ndvi: number | null; ndwi: number | null; }
interface DistData { name: string; value: number; }

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [selectedParcelleId, setSelectedParcelleId] = useState<string | null>(null);
  const [serie, setSerie] = useState<AnalyticsPoint[]>([]);
  const [statusDist, setStatusDist] = useState<DistData[]>([]);
  const [wilayasDist, setWilayasDist] = useState<DistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [serieLoading, setSerieLoading] = useState(false);

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    return { debut: formatDateInput(start), fin: formatDateInput(end) };
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      dashboardApi.stats(),
      dashboardApi.statusDistribution(),
      dashboardApi.wilayas(),
      parcellesApi.list()
    ]).then(([statsData, statusData, wilayasData, parcellesData]) => {
      if (!cancelled) {
        setStats(statsData);
        setStatusDist(statusData);
        setWilayasDist(wilayasData);
        setParcelles(parcellesData);
        if (parcellesData.length > 0 && !selectedParcelleId) {
          setSelectedParcelleId(parcellesData[0]._id);
        }
      }
    }).catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedParcelleId) return;
    let cancelled = false;
    setSerieLoading(true);
    getParcelleSeries(selectedParcelleId, dateRange.debut, dateRange.fin)
      .then((data) => {
        if (!cancelled) setSerie(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setSerieLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedParcelleId, dateRange.debut, dateRange.fin]);

  const barChartData = {
    labels: serie.map(s => s.date),
    datasets: [
      {
        label: "NDVI",
        data: serie.map(s => s.ndvi),
        backgroundColor: "#16a34a",
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      },
      {
        label: "NDWI",
        data: serie.map(s => s.ndwi),
        backgroundColor: "#2563eb",
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const, align: "end" as const, labels: { usePointStyle: true, boxWidth: 8 } }
    },
    scales: {
      y: { min: 0, max: 1, border: { display: false }, grid: { color: "#e2e8f0" } },
      x: { border: { display: false }, grid: { display: false } }
    }
  };

  // Status colors: Saines (green), Modérées (orange), Stress (red)
  const statusColors: Record<string, string> = {
    "Saines": "#10b981",
    "Modérées": "#f59e0b",
    "Stress": "#ef4444"
  };

  const donutChartData = {
    labels: statusDist.map(d => d.name),
    datasets: [
      {
        data: statusDist.map(d => d.value),
        backgroundColor: statusDist.map(d => statusColors[d.name] || "#cbd5e1"),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: { display: false }
    }
  };

  const formatTrend = (trend?: number, isInverseGood = false) => {
    if (trend == null || isNaN(trend)) return null;
    const isPositive = trend > 0;
    const isGood = isInverseGood ? !isPositive : isPositive;
    const colorClass = isGood ? "text-emerald-500" : "text-red-500";
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const absValue = Math.abs(trend);
    const text = Number.isInteger(absValue) ? absValue.toString() : absValue.toFixed(1) + "%";

    return (
      <span className={`flex items-center text-xs font-semibold ${colorClass}`}>
        <Icon className="mr-1 size-3" />
        {isPositive ? "+" : "-"}{text}
      </span>
    );
  };

  const wilayaColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#64748b"];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PlatformSidebar />
      <main className="flex-1 space-y-6 overflow-y-auto p-8">



        {/* KPI Cards */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total parcelles"
            icon={<Sprout className="size-4 text-emerald-500" />}
            iconBg="bg-emerald-50"
            value={loading ? null : `${stats?.activeParcelles ?? 0}`}
            trend={formatTrend(stats?.trendParcelles)}
            loading={loading}
          />
          <KpiCard
            title="NDVI moyen global"
            icon={<Activity className="size-4 text-emerald-500" />}
            iconBg="bg-emerald-50"
            value={loading ? null : stats?.ndviGlobalAvg ? stats.ndviGlobalAvg.toFixed(2) : "—"}
            trend={formatTrend(stats?.trendNdvi)}
            loading={loading}
          />
          <KpiCard
            title="Stress hydrique"
            icon={<Droplets className="size-4 text-amber-500" />}
            iconBg="bg-amber-50"
            value={loading ? null : `${stats?.stressHydriqueCount ?? 0}`}
            trend={formatTrend(stats?.trendStressHydrique, true)}
            loading={loading}
          />
          <KpiCard
            title="Alertes actives"
            icon={<Siren className="size-4 text-red-500" />}
            iconBg="bg-red-50"
            value={loading ? null : `${stats?.activeAlertsCount ?? 0}`}
            trend={formatTrend(stats?.trendAlerts, true)}
            loading={loading}
          />
        </section>

        {/* Bar Chart */}
        <section>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-0">
              <CardTitle className="text-base font-bold text-slate-800">Évolution des indices satellitaires</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 shadow-sm"
                  value={selectedParcelleId ?? ""}
                  onChange={(event) => setSelectedParcelleId(event.target.value)}
                >
                  {parcelles.map((parcelle) => (
                    <option key={parcelle._id} value={parcelle._id}>
                      {parcelle.nom}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 shadow-sm"
                    value={dateRange.debut}
                    onChange={(event) => setDateRange((prev) => ({ ...prev, debut: event.target.value }))}
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 shadow-sm"
                    value={dateRange.fin}
                    onChange={(event) => setDateRange((prev) => ({ ...prev, fin: event.target.value }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px] w-full">
                {serieLoading ? <Skeleton className="h-full w-full" /> : <Bar data={barChartData} options={barChartOptions} />}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Bottom Charts */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donut Chart */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Statut des parcelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="relative h-40 w-40">
                  {loading ? <Skeleton className="h-full w-full rounded-full" /> : <Doughnut data={donutChartData} options={donutChartOptions} />}
                </div>
                <div className="flex-1 space-y-4 pl-8">
                  {loading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    statusDist.map(item => {
                      const total = statusDist.reduce((acc, curr) => acc + curr.value, 0);
                      const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: statusColors[item.name] || "#cbd5e1" }} />
                            <span className="text-slate-600">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-800">{percent}%</span>
                        </div>
                      );
                    })
                  )}
                  <div className="pt-4">
                    <p className="text-[10px] text-slate-400">Source<br />Sentinel-2 - GEE</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wilayas List */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Parcelles par wilaya</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : wilayasDist.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune donnée</p>
                ) : (
                  wilayasDist.map((item, index) => {
                    const color = wilayaColors[index % wilayaColors.length];
                    return (
                      <div key={item.name} className="flex items-center gap-4 text-sm">
                        <div className="flex w-24 items-center gap-2 shrink-0">
                          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-slate-600 truncate">{item.name}</span>
                        </div>
                        <div className="flex-1 flex items-center">
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <div className="w-10 text-right font-bold text-slate-800 shrink-0">
                          {item.value}%
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
  iconBg,
  value,
  trend,
  loading,
}: {
  title: string;
  icon: ReactNode;
  iconBg: string;
  value: string | null;
  trend: ReactNode;
  loading: boolean;
}) => (
  <Card className="border-slate-200 shadow-sm">
    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
      <div className={`flex size-10 items-center justify-center rounded-md ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <div className="flex items-end gap-3">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl font-bold text-slate-800">{value ?? "—"}</span>
          )}
          {!loading && trend && <div className="mb-1">{trend}</div>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default DashboardPage;
