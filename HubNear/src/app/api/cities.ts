import { apiRequest } from "./client";
import type { City } from "./types";

export function listCities(params?: {
  query?: string;
  limit?: number;
}): Promise<City[]> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiRequest(`/cities${qs ? `?${qs}` : ""}`);
}

export function getCity(id: string): Promise<City> {
  return apiRequest(`/cities/${id}`);
}
