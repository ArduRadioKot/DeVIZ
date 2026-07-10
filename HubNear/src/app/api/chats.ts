import { apiRequest } from "./client";
import type { ChatBrief, ChatCreate, ChatDetail, MessageOut, MessageSend } from "./types";

export function listChats(): Promise<ChatBrief[]> {
  return apiRequest("/chats");
}

export function getChat(id: string): Promise<ChatDetail> {
  return apiRequest(`/chats/${id}`);
}

export function createChat(data: ChatCreate): Promise<ChatBrief> {
  return apiRequest("/chats", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listMessages(
  chatId: string,
  params?: { limit?: number; before?: string },
): Promise<MessageOut[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.before) searchParams.set("before", params.before);
  const qs = searchParams.toString();
  return apiRequest(`/chats/${chatId}/messages${qs ? `?${qs}` : ""}`);
}

export function sendMessage(chatId: string, data: MessageSend): Promise<MessageOut> {
  return apiRequest(`/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function removeMember(chatId: string, userId: string): Promise<void> {
  return apiRequest(`/chats/${chatId}/members/${userId}`, { method: "DELETE" });
}
