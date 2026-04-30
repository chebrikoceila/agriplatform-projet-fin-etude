import { useState } from "react";
import { Plus, Layers, Search, Sprout, Trash2, Pencil, X, Check, Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./StatusBadge";
import { formatHa } from "./utils";
import type { Parcelle } from "./types";

interface Props {
  parcelles: Parcelle[];
  loading: boolean;
  showList: boolean;
  selectedId: string | null;
  drawing: boolean;
  onSelect: (id: string) => void;
  onStartDraw: () => void;
  onCancelDraw: () => void;
  onRefresh: () => void;
  onOpenAlerts: () => void;
  onEdit: (parcelle: Parcelle) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ParcelleSidebar = ({
  parcelles,
  loading,
  showList,
  selectedId,
  drawing,
  onSelect,
  onStartDraw,
  onCancelDraw,
  onRefresh,
  onOpenAlerts,
  onEdit,
  onDelete,
}: Props) => {
  const [search, setSearch] = useState("");

  const filtered = parcelles.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase()),
  );

  const getHealthTone = (p: Parcelle) => {
    const culture = (p.cultureType ?? "").toLowerCase();
    const isUrban = ["ville", "urbain", "urbaine", "batiment", "bâtiment", "construction"].some((token) =>
      culture.includes(token),
    );
    const isDry = p.status === "critical" || (typeof p.ndviMoyen === "number" && p.ndviMoyen < 0.3);
    return isUrban || isDry ? "red" : "green";
  };

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col bg-gradient-sidebar text-sidebar-foreground">
      {/* Brand */}
      <a href="/" className="flex items-center gap-2.5 px-5 py-5 hover:bg-sidebar-accent/40 transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="AgriSpectra Logo" className="h-full w-full object-contain" />
        </div>
        <div className="leading-tight">
          <h1 className="text-xl font-bold tracking-tight text-[#087f5b]">AgriSpectra</h1>
        </div>
      </a>

      <Separator className="bg-sidebar-border" />

      {/* Actions */}
      <div className="space-y-2 px-5 py-4">
        {drawing ? (
          <Button
            key="cancel-draw"
            onClick={onCancelDraw}
            variant="outline"
            className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/70"
          >
            <X className="mr-2 size-4" />
            Annuler le dessin
          </Button>
        ) : (
          <Button
            key="start-draw"
            onClick={onStartDraw}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          >
            <Plus className="mr-2 size-4" />
            Ajouter une parcelle
          </Button>
        )}
        <Button
          onClick={onRefresh}
          variant="ghost"
          className="w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Layers className="mr-2 size-4" />
          Voir mes parcelles
        </Button>
        <Button
          onClick={onOpenAlerts}
          variant="ghost"
          className="w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Bell className="mr-2 size-4" />
          Centre d'alertes
        </Button>
      </div>

      {drawing && (
        <div className="mx-5 mb-3 rounded-md border border-sidebar-primary/30 bg-sidebar-primary/10 px-3 py-2 text-xs text-sidebar-foreground/90 animate-fade-in-up">
          Cliquez sur la carte pour dessiner les sommets. Double-cliquez pour terminer.
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      {/* Search */}
      <div className="px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une parcelle"
            className="border-sidebar-border bg-sidebar-accent pl-9 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-sidebar-ring"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex items-center justify-between px-5 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Parcelles
        </span>
        <span className="text-xs text-sidebar-foreground/60">{filtered.length}</span>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-sidebar-foreground/60">
              <Loader2 className="mr-2 size-4 animate-spin" /> Chargement…
            </div>
          )}
          {!showList && !loading && (
            <div className="px-2 py-8 text-center text-sm text-sidebar-foreground/60">
              Cliquez sur "Voir mes parcelles" pour afficher la liste.
            </div>
          )}
          {showList && !loading && filtered.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-sidebar-foreground/60">
              Aucune parcelle. Commencez par en ajouter une.
            </div>
          )}
          {showList && filtered.map((p) => {
            const isActive = p._id === selectedId;
            const tone = getHealthTone(p);
            return (
              <div
                key={p._id}
                onClick={() => onSelect(p._id)}
                className={cn(
                  "group cursor-pointer rounded-lg border px-3 py-2.5 transition-all",
                  isActive
                    ? "border-sidebar-primary/50 bg-sidebar-primary/15"
                    : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-sidebar-foreground">
                      <span
                        className={cn(
                          "inline-block size-2.5 rounded-full",
                          p.status === "critical"
                            ? "bg-red-500"
                            : p.status === "warning"
                              ? "bg-amber-500"
                              : "bg-emerald-500",
                        )}
                      />
                      {p.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-sidebar-foreground/60">
                      {p.cultureType ?? "Culture non spécifiée"} · {formatHa(p.surface ?? 0)}
                    </p>
                    <div className="mt-2 h-16 w-full overflow-hidden rounded-md border border-sidebar-border/70 bg-sidebar-background/60 p-1.5">
                      <PolygonPreview
                        coordinates={p.geometry.coordinates?.[0] ?? []}
                        color={tone === "red" ? "#dc2626" : "#16a34a"}
                      />
                    </div>
                    <div className="mt-2">
                      <StatusBadge ndvi={p.ndviMoyen} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                    >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(p._id); }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
};

interface PolygonPreviewProps {
  coordinates: number[][];
  color: string;
}

const PolygonPreview = ({ coordinates, color }: PolygonPreviewProps) => {
  if (!coordinates || coordinates.length < 3) {
    return <div className="flex h-full items-center text-[11px] text-sidebar-foreground/50">Polygone indisponible</div>;
  }

  const points = coordinates.slice(0, -1).length >= 3 ? coordinates.slice(0, -1) : coordinates;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngSpan = Math.max(maxLng - minLng, 0.000001);
  const latSpan = Math.max(maxLat - minLat, 0.000001);

  const path = points
    .map(([lng, lat], idx) => {
      const x = 10 + ((lng - minLng) / lngSpan) * 80;
      const y = 10 + (1 - (lat - minLat) / latSpan) * 80;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ")
    .concat(" Z");

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <path d={path} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={3} />
    </svg>
  );
};
