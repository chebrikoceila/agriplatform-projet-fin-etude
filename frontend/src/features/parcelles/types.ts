export interface AnalyticsPoint {
  date: string;
  ndvi: number | null;
  ndwi: number | null;
  precip?: number | null;
  temp?: number | null;
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
  datePlantation?: string;
  status?: "ok" | "warning" | "critical";
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

export interface AlertItem {
  _id: string;
  parcelleId: {
    _id: string;
    nom: string;
    status: "ok" | "warning" | "critical";
  };
  type: "Stress Hydrique" | "Santé" | "Mise à jour";
  valeurIndice: number;
  rapport?: string;
  date: string;
  isRead: boolean;
}

export const getCropStatus = (ndvi?: number | null): CropStatus => {
  if (ndvi == null || isNaN(ndvi)) return "unknown";
  if (ndvi > 0.6) return "good";
  if (ndvi >= 0.3) return "medium";
  return "stressed";
};
