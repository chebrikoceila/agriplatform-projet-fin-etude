import type { ParcelleGeometry } from "./types";

// Compute polygon area in hectares using Leaflet's GeoJSON ring (lng,lat).
// Uses spherical excess formula. Approximate.
const EARTH_RADIUS = 6378137;

export const polygonAreaHa = (geometry: ParcelleGeometry): number => {
  const ring = geometry.coordinates?.[0];
  if (!ring || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    area += ((lng2 - lng1) * Math.PI / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  area = (area * EARTH_RADIUS * EARTH_RADIUS) / 2;
  return Math.abs(area) / 10000; // ha
};

export const formatHa = (ha: number) => {
  if (!isFinite(ha) || ha <= 0) return "—";
  if (ha < 1) return `${(ha * 10000).toFixed(0)} m²`;
  return `${ha.toFixed(2)} ha`;
};

export const formatNumber = (n?: number | null, digits = 2) => {
  if (n == null || isNaN(n)) return "—";
  return n.toFixed(digits);
};

export const formatDate = (iso?: string | Date) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
};
