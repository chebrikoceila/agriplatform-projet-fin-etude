export interface AnalyticsPoint {
  date: string;
  ndvi: number | null;
  ndwi: number | null;
}

export interface ParcelleGeometry {
  type: "Polygon";
  coordinates: number[][][]; // [[[lng, lat], ...]]
}

export interface Parcelle {
  _id: string;
  nom: string;
  proprietaire: string;
  cultureType?: string;
  surface?: number;
  geometry: ParcelleGeometry;
  ndviMoyen?: number;
  ndwiMoyen?: number;
  analytics?: AnalyticsPoint[];
  createdAt: string;
}

export interface ParcelleDetails {
  info: Parcelle;
  analytics: AnalyticsPoint[];
}

export type CropStatus = "good" | "medium" | "stressed" | "unknown";

export const getCropStatus = (ndvi?: number | null): CropStatus => {
  if (ndvi == null || isNaN(ndvi)) return "unknown";
  if (ndvi > 0.6) return "good";
  if (ndvi >= 0.3) return "medium";
  return "stressed";
};
