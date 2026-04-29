import { cn } from "@/lib/utils";
import { getCropStatus, type CropStatus } from "./types";

const STATUS_CONFIG: Record<CropStatus, { label: string; className: string; dot: string }> = {
  good: {
    label: "Terre cultivée",
    className: "bg-status-good/10 text-status-good border-status-good/30",
    dot: "bg-status-good",
  },
  medium: {
    label: "Végétation modérée",
    className: "bg-status-medium/10 text-status-medium border-status-medium/30",
    dot: "bg-status-medium",
  },
  stressed: {
    label: "Cette terre est sèche",
    className: "bg-status-stressed/10 text-status-stressed border-status-stressed/30",
    dot: "bg-status-stressed",
  },
  unknown: {
    label: "Donnée indisponible",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

interface Props {
  ndvi?: number | null;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge = ({ ndvi, size = "md", className }: Props) => {
  const status = getCropStatus(ndvi);
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        cfg.className,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
};
