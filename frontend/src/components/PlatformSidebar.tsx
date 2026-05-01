import { useCallback, useState } from "react";
import { LayoutDashboard, Map, Bell, FileText, FileSpreadsheet } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Separator } from "@/components/ui/separator";
import { ExportParcelleShortcutDialog } from "@/components/ExportParcelleShortcutDialog";

const navItems = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/parcelles", label: "Parcelles", icon: Map },
  { to: "/alertes", label: "Alertes", icon: Bell },
];

const toolButtonClass =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";

export const PlatformSidebar = () => {
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [shortcutMode, setShortcutMode] = useState<"pdf" | "csv" | null>(null);

  const openShortcut = useCallback((mode: "pdf" | "csv") => {
    setShortcutMode(mode);
    setShortcutOpen(true);
  }, []);

  const handleShortcutOpenChange = useCallback((open: boolean) => {
    setShortcutOpen(open);
    if (!open) setShortcutMode(null);
  }, []);

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col bg-gradient-sidebar text-sidebar-foreground">
      <a href="/" className="flex items-center gap-2.5 px-5 py-5 transition-colors hover:bg-sidebar-accent/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="AgriSpectra Logo" className="h-full w-full object-contain" />
        </div>
        <div className="leading-tight">
          <h1 className="text-xl font-bold tracking-tight text-[#087f5b]">AgriSpectra</h1>
        </div>
      </a>

      <Separator className="bg-sidebar-border" />

      <div className="px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">Navigation</p>
      </div>

      <nav className="space-y-1 px-3 pb-4">
        {navItems.map((item) => (
          <NavLink
            key={`nav-${item.to}`}
            to={item.to}
            end={item.end}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeClassName="bg-sidebar-primary/15 text-sidebar-foreground"
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">Outils</p>
      </div>

      <nav className="space-y-1 px-3 pb-4">
        <button type="button" className={toolButtonClass} onClick={() => openShortcut("pdf")}>
          <FileText className="size-4" />
          Rapport PDF
        </button>
        <button type="button" className={toolButtonClass} onClick={() => openShortcut("csv")}>
          <FileSpreadsheet className="size-4" />
          Export CSV
        </button>
      </nav>

      <ExportParcelleShortcutDialog
        open={shortcutOpen}
        onOpenChange={handleShortcutOpenChange}
        mode={shortcutMode}
      />

      <div className="mt-auto px-5 pb-5">
        <Separator className="mb-4 bg-sidebar-border" />
        <div className="space-y-1 text-xs text-sidebar-foreground/75">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Sources de donnees
          </p>
          <p>
            <strong>Sentinel-2 - GEE</strong>
          </p>
          <p>Resolution: 10 m</p>
        </div>
      </div>
    </aside>
  );
};
