import { apiRequest } from "./client";
import type {
  ActivityListItem,
  Device,
  DeviceRegister,
  MeProfile,
  MeUpdate,
  Notification,
  Page,
  ReadAllNotificationsResult,
} from "./types";

export function getProfile(): Promise<MeProfile> {
  return apiRequest("/me");
}

export function updateProfile(data: MeUpdate): Promise<MeProfile> {
  return apiRequest("/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function listMyActivities(params?: {
  role?: "organizer" | "participant";
  limit?: number;
  cursor?: string;
}): Promise<Page<ActivityListItem>> {
  const searchParams = new URLSearchParams();
  if (params?.role) searchParams.set("role", params.role);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  const qs = searchParams.toString();
  return apiRequest(`/me/activities${qs ? `?${qs}` : ""}`);
}

export function listNotifications(params?: {
  limit?: number;
  cursor?: string;
}): Promise<Page<Notification>> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  const qs = searchParams.toString();
  return apiRequest(`/me/notifications${qs ? `?${qs}` : ""}`);
}

export function markNotificationRead(notificationId: string): Promise<Notification> {
  return apiRequest(`/me/notifications/${notificationId}/read`, { method: "POST" });
}

export function markAllNotificationsRead(): Promise<ReadAllNotificationsResult> {
  return apiRequest("/me/notifications/read-all", { method: "POST" });
}

export function listDevices(): Promise<Device[]> {
  return apiRequest("/me/devices");
}

export function registerDevice(data: DeviceRegister): Promise<Device> {
  return apiRequest("/me/devices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteDevice(deviceId: string): Promise<void> {
  return apiRequest(`/me/devices/${deviceId}`, { method: "DELETE" });
}
