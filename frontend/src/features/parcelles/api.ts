import axios from "axios";
import type { AlertItem, AnalyticsPoint, Parcelle, ParcelleDetails, ParcelleGeometry, ParcelleMeteo } from "./types";

// Configurez VITE_API_URL dans .env.local pour pointer vers votre backend.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const client = axios.create({
  baseURL: `${API_BASE}/api/parcelles`,
  headers: { "Content-Type": "application/json" },
});

const alertsClient = axios.create({
  baseURL: `${API_BASE}/api/alertes`,
  headers: { "Content-Type": "application/json" },
});

const dashboardClient = axios.create({
  baseURL: `${API_BASE}/api/dashboard`,
  headers: { "Content-Type": "application/json" },
});

const pushClient = axios.create({
  baseURL: `${API_BASE}/api/push`,
  headers: { "Content-Type": "application/json" },
});

export interface CreateParcellePayload {
  nom: string;
  proprietaire: string;
  cultureType?: string;
  datePlantation?: string;
  surface?: number;
  geometry: ParcelleGeometry;
}

export const parcellesApi = {
  list: async (): Promise<Parcelle[]> => {
    const { data } = await client.get<Parcelle[]>("/");
    return data;
  },
  get: async (id: string): Promise<ParcelleDetails> => {
    const { data } = await client.get<ParcelleDetails>(`/${id}`);
    return data;
  },
  create: async (payload: CreateParcellePayload) => {
    const { data } = await client.post("/", payload);
    return data as { success: boolean; info: Parcelle; analytics: AnalyticsPoint[]; ndviMoyen: number; ndwiMoyen: number };
  },
  update: async (id: string, payload: Partial<CreateParcellePayload>) => {
    const { data } = await client.put(`/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await client.delete(`/${id}`);
    return data;
  },
  analyzeStress: async (id: string) => {
    const { data } = await client.post(`/${id}/analyze-stress`);
    return data;
  },
};

export const alertsApi = {
  list: async (params?: { limit?: number; statut?: "active" }): Promise<AlertItem[]> => {
    const { data } = await alertsClient.get<AlertItem[]>("/", { params });
    return data;
  },
  markRead: async (id: string): Promise<AlertItem> => {
    const { data } = await alertsClient.patch<AlertItem>(`/${id}/read`);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await alertsClient.delete(`/${id}`);
    return data as { success: boolean };
  },
  clearRead: async () => {
    const { data } = await alertsClient.delete("/", { params: { mode: "read" } });
    return data as { success: boolean; deletedCount: number };
  },
  clearAll: async () => {
    const { data } = await alertsClient.delete("/", { params: { mode: "all" } });
    return data as { success: boolean; deletedCount: number };
  },
};

export interface DashboardStats {
  activeParcelles: number;
  ndviGlobalAvg: number | null;
  stressHydriqueCount: number;
  activeAlertsCount: number;
}

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> => {
    const { data } = await dashboardClient.get<DashboardStats>("/stats");
    return data;
  },
};

export const getParcelleSeries = async (id: string, debut: string, fin: string): Promise<AnalyticsPoint[]> => {
  const { data } = await client.get<{ analytics: AnalyticsPoint[] }>(`/${id}/serie-temporelle`, {
    params: { debut, fin },
  });
  return data.analytics ?? [];
};

export const getParcelleMeteo = async (id: string): Promise<ParcelleMeteo> => {
  const { data } = await client.get<ParcelleMeteo>(`/${id}/meteo`);
  return data;
};

export const pushApi = {
  subscribe: async (subscription: PushSubscriptionJSON) => {
    const { data } = await pushClient.post("/subscribe", subscription);
    return data;
  },
  unsubscribe: async (endpoint: string) => {
    const { data } = await pushClient.post("/unsubscribe", { endpoint });
    return data;
  },
};

export const getVapidPublicKey = () =>
  import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
