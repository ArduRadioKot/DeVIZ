import { apiRequest } from "./client";
import type { ActivityCreate, ActivityDetail, ActivityListItem, Page, Participant } from "./types";

export function listActivities(params?: {
  city_id?: string;
  category?: string;
  status?: string;
  search?: string;
  lat?: number;
  lon?: number;
  radius_m?: number;
  limit?: number;
  cursor?: string;
}): Promise<Page<ActivityListItem>> {
  const searchParams = new URLSearchParams();
  if (params?.city_id) searchParams.set("city_id", params.city_id);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.lat !== undefined) searchParams.set("lat", String(params.lat));
  if (params?.lon !== undefined) searchParams.set("lon", String(params.lon));
  if (params?.radius_m) searchParams.set("radius_m", String(params.radius_m));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  const qs = searchParams.toString();
  return apiRequest(`/activities${qs ? `?${qs}` : ""}`);
}

export function getActivity(id: string): Promise<ActivityDetail> {
  return apiRequest(`/activities/${id}`);
}

export function createActivity(data: ActivityCreate): Promise<ActivityDetail> {
  return apiRequest("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listParticipants(activityId: string): Promise<Participant[]> {
  return apiRequest(`/activities/${activityId}/participants`);
}

export function joinActivity(activityId: string): Promise<ActivityDetail> {
  return apiRequest(`/activities/${activityId}/join`, { method: "POST" });
}

export function leaveActivity(activityId: string): Promise<ActivityDetail> {
  return apiRequest(`/activities/${activityId}/leave`, { method: "POST" });
}

export function cancelActivity(activityId: string): Promise<ActivityDetail> {
  return apiRequest(`/activities/${activityId}/cancel`, { method: "POST" });
}
