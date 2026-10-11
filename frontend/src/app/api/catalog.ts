import { apiRequest } from "./client";
import type { CatalogItem } from "./types";

export function listActivityCategories(): Promise<CatalogItem[]> {
  return apiRequest("/catalog/activity-categories");
}

export function listActivityLevels(): Promise<CatalogItem[]> {
  return apiRequest("/catalog/activity-levels");
}
