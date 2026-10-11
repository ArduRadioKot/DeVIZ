import { useCallback, useEffect, useMemo, useState } from "react";
import * as chatsApi from "../api/chats";
import { wsManager } from "../api/ws";
import type { ChatItem, ChatParticipant, Event, Message } from "../types";
import type { ChatBrief } from "../api/types";

function apiChatToChatItem(c: ChatBrief): ChatItem {
  const time = c.last_message_at
    ? new Date(c.last_message_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : "";
  return {
    id: c.id,
    name: c.name,
    avatar: "https://i.pravatar.cc/150?img=5",
    last: c.last_message || "",
    time,
    unread: c.unread_count,
    group: c.type === "event",
    eventId: c.event_id || undefined,
  };
}

function createEventChat(event: Event): ChatItem {
  return {
    id: `event-${event.id}`,
    name: event.activity,
    avatar: event.avatar,
    last: `Чат мероприятия «${event.activity}»`,
    time: "только что",
    unread: 0,
    group: true,
    eventId: event.id,
  };
}

function createEventWelcomeMessage(event: Event): Message {
  return {
    id: `evt-msg-${event.id}-${Date.now()}`,
    chatId: `event-${event.id}`,
    fromMe: false,
    text: `Добро пожаловать в чат сбора «${event.activity}»! Место встречи: ${event.location}, время: ${event.time}.`,
    time: new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function useChats(isApiAvailable: boolean) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(undefined);
  const [selectedChatForParticipants, setSelectedChatForParticipants] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiAvailable) return;
    wsManager.connect();
    const unsub = wsManager.on("new_message", (msg: any) => {
      const m = msg.message;
      if (!m) return;
      const newMsg: Message = {
        id: m.id || `ws-${Date.now()}`,
        chatId: m.chat_id,
        fromMe: false,
        text: m.text,
        time: m.created_at
          ? new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => {
        if (prev.some((p) => p.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setChats((prev) =>
        prev.map((c) =>
          c.id === m.chat_id ? { ...c, last: m.text, time: newMsg.time } : c,
        ),
      );
    });
    return () => {
      unsub();
      wsManager.disconnect();
    };
  }, [isApiAvailable]);

  const loadChats = useCallback(async () => {
    try {
      const apiChats = await chatsApi.listChats();
      setChats((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newChats = apiChats.filter((c) => !existingIds.has(c.id)).map(apiChatToChatItem);
        if (newChats.length === 0) return prev;
        return [...prev, ...newChats];
      });
    } catch {}
  }, []);

  const subscribeToChat = useCallback((chatId: string) => {
    wsManager.subscribe(chatId);
  }, []);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    wsManager.unsubscribe(chatId);
  }, []);

  const joinEventChat = useCallback((event: Event) => {
    const chatId = `event-${event.id}`;
    setChats((prev) => {
      if (prev.some((c) => c.id === chatId)) return prev;
      return [...prev, createEventChat(event)];
    });
    setMessages((prev) => [...prev, createEventWelcomeMessage(event)]);
  }, []);

  const handleSendMessage = useCallback((chatId: string, text: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      fromMe: true,
      text,
      time,
    };
    setMessages((prev) => [...prev, newMsg]);
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, last: text, time, unread: 0 } : c,
      ),
    );
    if (isApiAvailable) {
      const sent = wsManager.sendMessage(chatId, text);
      if (!sent && !chatId.startsWith("event-") && !chatId.startsWith("dm-")) {
        chatsApi.sendMessage(chatId, { text }).catch(() => {});
      }
    }
  }, [isApiAvailable]);

  const handleSendMessageTo = useCallback((participant: ChatParticipant) => {
    const chatId = `dm-${participant.id}`;
    setChats((prev) => {
      if (prev.some((c) => c.id === chatId)) return prev;
      const now = new Date();
      const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const newChat: ChatItem = {
        id: chatId,
        name: participant.name,
        avatar: participant.avatar,
        last: "",
        time,
        unread: 0,
        group: false,
      };
      return [...prev, newChat];
    });
    setActiveChatId(chatId);
  }, []);

  const getParticipantsForChat = useCallback(
    (chatId: string, events: Event[]): ChatParticipant[] => {
      const chat = chats.find((c) => c.id === chatId);
      if (chat?.eventId) {
        const event = events.find((e) => e.id === chat.eventId);
        if (event) {
          return [
            { id: `org-${event.id}`, name: event.organizer, avatar: event.avatar, role: "organizer" },
          ];
        }
      }
      return [];
    },
    [chats],
  );

  const handleViewParticipants = useCallback((chatId: string, setScreen: (s: any) => void, setPrevScreen: (s: any) => void) => {
    setSelectedChatForParticipants(chatId);
    setPrevScreen("chats");
    setScreen("chat-participants");
  }, []);

  const currentParticipants = useMemo(
    () => [], // computed in useHubData
    [],
  );

  const currentChatName = useMemo(
    () => chats.find((c) => c.id === selectedChatForParticipants)?.name ?? "",
    [chats, selectedChatForParticipants],
  );

  return {
    chats,
    setChats,
    messages,
    setMessages,
    activeChatId,
    setActiveChatId,
    selectedChatForParticipants,
    setSelectedChatForParticipants,
    loadChats,
    joinEventChat,
    subscribeToChat,
    unsubscribeFromChat,
    handleSendMessage,
    handleSendMessageTo,
    getParticipantsForChat,
    handleViewParticipants,
    currentChatName,
  };
}
