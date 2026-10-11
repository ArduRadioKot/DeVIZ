import { apiRequest } from "./client";
import type { UserPlace, UserPlaceCreate } from "./types";

export function listPlaces(): Promise<UserPlace[]> {
  return apiRequest("/me/places");
}

export function createPlace(data: UserPlaceCreate): Promise<UserPlace> {
  return apiRequest("/me/places", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deletePlace(placeId: string): Promise<void> {
  return apiRequest(`/me/places/${placeId}`, { method: "DELETE" });
}
