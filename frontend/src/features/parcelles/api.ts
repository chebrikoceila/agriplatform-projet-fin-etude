import axios from "axios";
import type { Parcelle, ParcelleDetails, ParcelleGeometry } from "./types";

// Configurez VITE_API_URL dans .env.local pour pointer vers votre backend.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const client = axios.create({
  baseURL: `${API_BASE}/api/parcelles`,
  headers: { "Content-Type": "application/json" },
});

export interface CreateParcellePayload {
  nom: string;
  proprietaire: string;
  cultureType?: string;
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
    return data as { success: boolean; info: Parcelle; analytics: any[]; ndviMoyen: number; ndwiMoyen: number };
  },
  update: async (id: string, payload: Partial<CreateParcellePayload>) => {
    const { data } = await client.put(`/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await client.delete(`/${id}`);
    return data;
  },
};
