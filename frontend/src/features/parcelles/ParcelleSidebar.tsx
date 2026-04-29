import { useState } from "react";
import { Plus, Layers, Search, Sprout, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
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
  selectedId: string | null;
  drawing: boolean;
  onSelect: (id: string) => void;
  onStartDraw: () => void;
  onCancelDraw: () => void;
  onRefresh: () => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ParcelleSidebar = ({
  parcelles,
  loading,
  selectedId,
  drawing,
  onSelect,
  onStartDraw,
  onCancelDraw,
  onRefresh,
  onRename,
  onDelete,
}: Props) => {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = parcelles.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase()),
  );

  const startEdit = (p: Parcelle) => {
    setEditingId(p._id);
    setEditValue(p.nom);
  };

  const submitEdit = async () => {
    if (editingId && editValue.trim()) {
      await onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col bg-gradient-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
          <Sprout className="size-5" />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-semibold tracking-tight">AgriSelect</h1>
        </div>
      </div>

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
          {!loading && filtered.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-sidebar-foreground/60">
              Aucune parcelle. Commencez par en ajouter une.
            </div>
          )}
          {filtered.map((p) => {
            const isActive = p._id === selectedId;
            const isEditing = editingId === p._id;
            return (
              <div
                key={p._id}
                onClick={() => !isEditing && onSelect(p._id)}
                className={cn(
                  "group cursor-pointer rounded-lg border px-3 py-2.5 transition-all",
                  isActive
                    ? "border-sidebar-primary/50 bg-sidebar-primary/15"
                    : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-7 border-sidebar-border bg-sidebar-background text-sm text-sidebar-foreground"
                        />
                        <Button size="icon" variant="ghost" className="size-7 text-sidebar-foreground hover:bg-sidebar-accent" onClick={submitEdit}>
                          <Check className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {p.nom}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-sidebar-foreground/60">
                      {p.cultureType ?? "Culture non spécifiée"} · {formatHa(p.surface ?? 0)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge ndvi={p.ndviMoyen} size="sm" />
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        onClick={(e) => { e.stopPropagation(); startEdit(p); }}
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
};
