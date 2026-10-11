import { apiRequest } from "./client";
import type { Friend, FriendRequest } from "./types";

export function listFriends(): Promise<Friend[]> {
  return apiRequest("/friends");
}

export function addFriend(userId: string): Promise<void> {
  return apiRequest(`/friends/${userId}`, { method: "POST" });
}

export function removeFriend(userId: string): Promise<void> {
  return apiRequest(`/friends/${userId}`, { method: "DELETE" });
}

export function listFriendRequests(): Promise<FriendRequest[]> {
  return apiRequest("/friends/requests");
}

export function sendFriendRequest(userId: string): Promise<void> {
  return apiRequest(`/friends/requests/${userId}`, { method: "POST" });
}

export function acceptFriendRequest(userId: string): Promise<void> {
  return apiRequest(`/friends/requests/${userId}/accept`, { method: "POST" });
}

export function rejectFriendRequest(userId: string): Promise<void> {
  return apiRequest(`/friends/requests/${userId}/reject`, { method: "POST" });
}
