import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../components/ui/use-mobile";
import { getStoredToken } from "../api/client";
import { useEvents } from "./useEvents";
import { useChats } from "./useChats";
import { useFriends } from "./useFriends";
import { useNotifications } from "./useNotifications";
import { useProfile } from "./useProfile";
import type { ChatItem, ChatParticipant, Event, Friend, Message, NotificationItem, Place, Screen, UserProfile } from "../types";

function createQuorumNotification(eventName: string): NotificationItem {
  return {
    id: `notif-${Date.now()}`,
    title: "Кворум собран!",
    body: `${eventName} подтверждён — собираемся вовремя`,
    time: "только что",
    read: false,
    type: "quorum",
  };
}

export interface HubData {
  screen: Screen;
  setScreen: (s: Screen) => void;
  events: Event[];
  setEvents: (e: Event[]) => void;
  chats: ChatItem[];
  messages: Message[];
  notifications: NotificationItem[];
  myPlaces: Place[];
  userProfile: UserProfile;
  joinedEventIds: Set<string>;
  friends: Friend[];

  activeChatId: string | undefined;
  isApiAvailable: boolean;
  apiLoading: boolean;
  isMobile: boolean;
  unreadNotifications: number;
  friendIds: Set<string>;
  currentParticipants: ChatParticipant[];
  currentChatName: string;
  handleCreateEvent: (e: Event) => Promise<void>;
  handleJoinEvent: (e: Event) => Promise<void>;
  handleLeaveEvent: (id: string) => Promise<void>;
  handleSendMessage: (chatId: string, text: string) => void;
  handleMarkNotificationRead: (id: string) => Promise<void>;
  handleMarkAllNotificationsRead: () => Promise<void>;
  handleAddPlace: (p: Place) => void;
  handleRemovePlace: (id: string) => void;
  handleUpdateProfile: (p: UserProfile) => Promise<void>;
  setSelectedChatForParticipants: (id: string | null) => void;
  setPrevScreen: (s: Screen) => void;
  isFriend: (p: ChatParticipant) => boolean;
  handleAddFriend: (p: ChatParticipant) => void;
  handleSendMessageTo: (p: ChatParticipant) => void;
  getParticipantsForChat: (chatId: string) => ChatParticipant[];
  handleViewParticipants: (chatId: string) => void;
  handleViewProfile: (participant: ChatParticipant, from: Screen) => void;
  selectedUser: ChatParticipant | null;
  prevScreen: Screen;
  navigate: (s: Screen) => void;
  navigateBack: () => void;
  viewProfileOf: (participant: ChatParticipant, from: Screen) => void;
}

export function useHubData(): HubData {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [prevScreen, setPrevScreen] = useState<Screen>("chats");
  const [selectedUser, setSelectedUser] = useState<ChatParticipant | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const isMobile = useIsMobile();

  const {
    events,
    setEvents,
    joinedEventIds,
    loadEvents,
    handleCreateEvent,
    handleJoinEvent: eventsJoin,
    handleLeaveEvent: eventsLeave,
  } = useEvents(isApiAvailable);

  const {
    chats,
    messages,
    activeChatId,
    setActiveChatId,
    selectedChatForParticipants,
    setSelectedChatForParticipants,
    loadChats,
    joinEventChat,
    subscribeToChat,
    unsubscribeFromChat,
    handleSendMessage,
    handleSendMessageTo: chatsSendMessageTo,
    getParticipantsForChat: getParticipants,
    currentChatName,
  } = useChats(isApiAvailable);

  const {
    friends,
    friendIds,
    isFriend,
    handleAddFriend,
    loadFriends,
  } = useFriends(isApiAvailable);

  const {
    notifications,
    unreadNotifications,
    loadNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
  } = useNotifications(isApiAvailable);

  const {
    userProfile,
    setUserProfile,
    myPlaces,
    handleUpdateProfile,
    handleAddPlace,
    handleRemovePlace,
    loadProfile,
  } = useProfile(isApiAvailable);

  useEffect(() => {
    async function loadData() {
      if (!getStoredToken()) {
        setApiLoading(false);
        return;
      }
      try {
        await Promise.all([
          loadEvents(),
          loadProfile(),
          loadNotifications(),
          loadFriends(),
          loadChats(),
        ]);
        setIsApiAvailable(true);
      } catch {}
      setApiLoading(false);
    }
    loadData();

    const onUnauthorized = () => {
      setIsApiAvailable(false);
      setScreen("login");
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const handleJoinEvent = useCallback(
    async (event: Event) => {
      await eventsJoin(event);
      joinEventChat(event);
      if (event.current + 1 >= event.needed) {
        setNotifications((prev: NotificationItem[]) =>
          [...prev, createQuorumNotification(event.activity)]
        );
      }
    },
    [eventsJoin, joinEventChat, setNotifications],
  );

  const handleLeaveEvent = useCallback(
    async (eventId: string) => {
      await eventsLeave(eventId);
    },
    [eventsLeave],
  );

  const handleSendMessageTo = useCallback(
    (participant: ChatParticipant) => {
      chatsSendMessageTo(participant);
      setScreen("chats");
    },
    [chatsSendMessageTo],
  );

  const getParticipantsForChat = useCallback(
    (chatId: string) => getParticipants(chatId, events),
    [getParticipants, events],
  );

  const handleViewParticipants = useCallback(
    (chatId: string) => {
      setSelectedChatForParticipants(chatId);
      setPrevScreen("chats");
      setScreen("chat-participants");
    },
    [],
  );

  const handleViewProfile = useCallback(
    (participant: ChatParticipant, from: Screen) => {
      setSelectedUser(participant);
      setPrevScreen(from);
      setScreen("other-profile");
    },
    [],
  );

  const navigate = useCallback((s: Screen) => setScreen(s), []);

  const navigateBack = useCallback(() => {
    setScreen(prevScreen);
  }, [prevScreen]);

  const viewProfileOf = useCallback(
    (participant: ChatParticipant, from: Screen) => {
      setSelectedUser(participant);
      setPrevScreen(from);
      setScreen("other-profile");
    },
    [],
  );

  const currentParticipants = useMemo(
    () => (selectedChatForParticipants ? getParticipantsForChat(selectedChatForParticipants) : []),
    [selectedChatForParticipants, getParticipantsForChat],
  );

  return {
    screen, setScreen,
    events, setEvents,
    chats, messages, notifications,
    myPlaces, userProfile, joinedEventIds, friends, activeChatId,
    isApiAvailable, apiLoading, isMobile,
    unreadNotifications, friendIds,
    currentParticipants, currentChatName,
    handleCreateEvent, handleJoinEvent, handleLeaveEvent,
    handleSendMessage, handleMarkNotificationRead, handleMarkAllNotificationsRead,
    handleAddPlace, handleRemovePlace, handleUpdateProfile,
    setSelectedChatForParticipants, setPrevScreen,
    isFriend, handleAddFriend, handleSendMessageTo,
    getParticipantsForChat, handleViewParticipants, handleViewProfile,
    selectedUser, prevScreen, navigate, navigateBack, viewProfileOf,
  };
}
