import { useCallback, useMemo, useState } from "react";
import { useIsMobile } from "./components/ui/use-mobile";
import { BottomNav, SidebarNav } from "./components/navigation";
import { EVENTS } from "./data/events";
import { INITIAL_CHATS, INITIAL_MESSAGES, createEventChat, createEventWelcomeMessage } from "./data/chats";
import { INITIAL_NOTIFICATIONS, createDeadlineNotification, createQuorumNotification } from "./data/notifications";
import { WelcomeScreen } from "./screens/welcome";
import { AuthScreen } from "./screens/auth-form";
import { ChatsScreen } from "./screens/chats";
import { CreateEventScreen, FeedScreen } from "./screens/feed";
import { FriendsScreen } from "./screens/friends";
import { NotificationsScreen } from "./screens/notifications";
import { ProfileScreen } from "./screens/profile";
import { SettingsScreen } from "./screens/settings";
import { EditProfileScreen } from "./screens/edit-profile";
import { ChangePasswordScreen } from "./screens/change-password";
import { ChatParticipantsScreen } from "./screens/chat-participants";
import { OtherProfileScreen } from "./screens/other-profile";
import { VisitedEventsScreen } from "./screens/visited";
import type { ChatItem, ChatParticipant, Event, Friend, Message, NotificationItem, Place, Screen, UserProfile } from "./types";

const INITIAL_PLACES: Place[] = [
  { id: "p1", name: "Красный камень", img: "https://picsum.photos/seed/place1/200/150" },
  { id: "p2", name: "Гурзуф", img: "https://picsum.photos/seed/place2/200/150" },
  { id: "p3", name: "Краснокаменка", img: "https://picsum.photos/seed/place3/200/150" },
];

const INITIAL_FRIENDS: Friend[] = [
  { id: "f1", name: "Дима", avatar: "https://i.pravatar.cc/150?img=11", mutualEvents: 5 },
  { id: "f2", name: "Рита", avatar: "https://i.pravatar.cc/150?img=9", mutualEvents: 3 },
  { id: "f3", name: "Катя", avatar: "https://i.pravatar.cc/150?img=22", mutualEvents: 7 },
  { id: "f4", name: "Иван", avatar: "https://i.pravatar.cc/150?img=30", mutualEvents: 2 },
  { id: "f5", name: "Алексей", avatar: "https://i.pravatar.cc/150?img=11", mutualEvents: 4 },
  { id: "f6", name: "Анна", avatar: "https://i.pravatar.cc/150?img=9", mutualEvents: 6 },
  { id: "f7", name: "Мария", avatar: "https://i.pravatar.cc/150?img=5", mutualEvents: 1 },
  { id: "f8", name: "Игорь", avatar: "https://i.pravatar.cc/150?img=33", mutualEvents: 3 },
];
const CHAT_PARTICIPANTS: Record<string, ChatParticipant[]> = {
  devs: [
    { id: "u1", name: "Алексей", avatar: "https://i.pravatar.cc/150?img=11", role: "admin" },
    { id: "u2", name: "Анна", avatar: "https://i.pravatar.cc/150?img=9", role: "member" },
    { id: "u3", name: "София Достоевская", avatar: "https://i.pravatar.cc/150?img=5", role: "member" },
    { id: "u4", name: "Дима", avatar: "https://i.pravatar.cc/150?img=68", role: "member" },
  ],
  hike: [
    { id: "u5", name: "Мария", avatar: "https://i.pravatar.cc/150?img=5", role: "organizer" },
    { id: "u6", name: "Игорь", avatar: "https://i.pravatar.cc/150?img=33", role: "member" },
    { id: "u7", name: "Елена", avatar: "https://i.pravatar.cc/150?img=22", role: "member" },
    { id: "u8", name: "Рита", avatar: "https://i.pravatar.cc/150?img=9", role: "member" },
  ],
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [events, setEvents] = useState<Event[]>(EVENTS);
  const [chats, setChats] = useState<ChatItem[]>(INITIAL_CHATS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [myPlaces, setMyPlaces] = useState<Place[]>(INITIAL_PLACES);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "София Достоевская",
    username: "annahanova",
    avatar: "https://i.pravatar.cc/150?img=5",
  });
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());
  const [selectedChatForParticipants, setSelectedChatForParticipants] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatParticipant | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>("chats");
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();

  const showNav = ["feed", "chats", "profile"].includes(screen);

  const getActiveTab = (): Screen => {
    if (screen === "feed") return "feed";
    if (screen === "chats") return "chats";
    if (screen === "profile") return "profile";
    return "feed";
  };

  const handleCreateEvent = (newEvent: Event) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleJoinEvent = useCallback((event: Event) => {
    const chatId = `event-${event.id}`;
    setChats((prev) => {
      if (prev.some((c) => c.id === chatId)) return prev;
      return [...prev, createEventChat(event)];
    });
    setMessages((prev) => [...prev, createEventWelcomeMessage(event)]);

    setJoinedEventIds((prev) => new Set(prev).add(event.id));

    const newCurrent = event.current + 1;
    if (newCurrent >= event.needed) {
      setNotifications((prev) => [...prev, createQuorumNotification(event.activity)]);
    }
  }, []);

  const handleLeaveEvent = useCallback((eventId: string) => {
    setJoinedEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }, []);

  const handleSendMessage = useCallback((chatId: string, text: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
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
  }, []);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleAddPlace = useCallback((place: Place) => {
    setMyPlaces((prev) => [...prev, place]);
  }, []);

  const handleRemovePlace = useCallback((id: string) => {
    setMyPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdateProfile = useCallback((p: UserProfile) => {
    setUserProfile(p);
  }, []);

  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const getParticipantsForChat = useCallback((chatId: string): ChatParticipant[] => {
    if (CHAT_PARTICIPANTS[chatId]) return CHAT_PARTICIPANTS[chatId];
    const chat = chats.find((c) => c.id === chatId);
    if (chat?.eventId) {
      const event = events.find((e) => e.id === chat.eventId);
      if (event) {
        return [
          { id: `org-${event.id}`, name: event.organizer, avatar: event.avatar, role: "organizer" },
          { id: "u3", name: "София Достоевская", avatar: "https://i.pravatar.cc/150?img=5", role: "member" },
          { id: "u1", name: "Алексей", avatar: "https://i.pravatar.cc/150?img=11", role: "member" },
        ];
      }
    }
    return [{ id: "u3", name: "София Достоевская", avatar: "https://i.pravatar.cc/150?img=5", role: "member" }];
  }, [chats, events]);

  const handleViewParticipants = useCallback((chatId: string) => {
    setSelectedChatForParticipants(chatId);
    setPrevScreen("chats");
    setScreen("chat-participants");
  }, []);

  const handleViewProfile = useCallback((participant: ChatParticipant, from: Screen) => {
    setSelectedUser(participant);
    setPrevScreen(from);
    setScreen("other-profile");
  }, []);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  const isFriend = useCallback(
    (participant: ChatParticipant) => friendIds.has(participant.id),
    [friendIds],
  );

  const handleAddFriend = useCallback((participant: ChatParticipant) => {
    setFriends((prev) => {
      if (prev.some((f) => f.id === participant.id)) return prev;
      return [...prev, { id: participant.id, name: participant.name, avatar: participant.avatar, mutualEvents: 0 }];
    });
  }, []);

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
    setScreen("chats");
  }, []);

  // Build participant list for current chat
  const currentParticipants = useMemo(
    () => (selectedChatForParticipants ? getParticipantsForChat(selectedChatForParticipants) : []),
    [selectedChatForParticipants, getParticipantsForChat],
  );
  const currentChatName = useMemo(
    () => chats.find((c) => c.id === selectedChatForParticipants)?.name ?? "",
    [chats, selectedChatForParticipants],
  );

  const mainContent = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {screen === "welcome" && <WelcomeScreen onNavigate={setScreen} />}
      {screen === "register" && (
        <AuthScreen mode="register" onNavigate={setScreen} />
      )}
      {screen === "login" && <AuthScreen mode="login" onNavigate={setScreen} />}
      {screen === "feed" && (
        <FeedScreen
          events={events}
          onEventsChange={setEvents}
          onCreateClick={() => setScreen("create")}
          onJoinEvent={handleJoinEvent}
          onLeaveEvent={handleLeaveEvent}
          unreadNotifications={unreadNotifications}
          onNotificationsClick={() => setScreen("notifications")}
          userName={userProfile.name}
        />
      )}
      {screen === "profile" && (
        <ProfileScreen
          onNavigate={setScreen}
          myPlaces={myPlaces}
          onAddPlace={handleAddPlace}
          onRemovePlace={handleRemovePlace}
          profile={userProfile}
          events={events}
          joinedEventIds={joinedEventIds}
          onViewFriendProfile={(f) => handleViewProfile(
            { id: f.name, name: f.name, avatar: f.avatar, role: "member" },
            "profile",
          )}
          friendsCount={friends.length}
          onNavigateToFriends={() => setScreen("friends")}
        />
      )}
      {screen === "visited" && (
        <VisitedEventsScreen
          events={events}
          joinedEventIds={joinedEventIds}
          onNavigate={setScreen}
        />
      )}
      {screen === "chat-participants" && (
        <ChatParticipantsScreen
          participants={currentParticipants}
          chatName={currentChatName}
          onNavigate={setScreen}
          onViewProfile={(p) => handleViewProfile(p, "chat-participants")}
        />
      )}
      {screen === "other-profile" && (
        <OtherProfileScreen
          user={selectedUser}
          onNavigate={(s) => { if (s === "chats") setScreen(prevScreen); else setScreen(s); }}
          isFriend={selectedUser ? isFriend(selectedUser) : false}
          onAddFriend={selectedUser ? () => handleAddFriend(selectedUser) : undefined}
          onSendMessage={selectedUser ? () => handleSendMessageTo(selectedUser) : undefined}
        />
      )}
      {screen === "chats" && (
        <ChatsScreen
          key={activeChatId ?? "default"}
          chats={chats}
          messages={messages}
          onSendMessage={handleSendMessage}
          onNavigate={setScreen}
          onViewParticipants={handleViewParticipants}
          initialActiveChatId={activeChatId}
        />
      )}
      {screen === "create" && (
        <CreateEventScreen onNavigate={setScreen} onCreate={handleCreateEvent} />
      )}
      {screen === "settings" && <SettingsScreen onNavigate={setScreen} />}
      {screen === "notifications" && (
        <NotificationsScreen
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onNavigate={setScreen}
        />
      )}
      {screen === "edit-profile" && (
        <EditProfileScreen
          profile={userProfile}
          onSave={handleUpdateProfile}
          onNavigate={setScreen}
        />
      )}
      {screen === "change-password" && (
        <ChangePasswordScreen onNavigate={setScreen} />
      )}
      {screen === "friends" && (
        <FriendsScreen
          friends={friends}
          onNavigate={setScreen}
          onViewProfile={(f) => handleViewProfile(
            { id: f.id, name: f.name, avatar: f.avatar, role: "member" },
            "friends",
          )}
          onWrite={handleSendMessageTo}
        />
      )}
    </div>
  );

  return (
    <div
      className="app-shell"
      style={{
        fontFamily: "Montserrat, sans-serif",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        overflow: "hidden",
      }}
    >
      {showNav && !isMobile ? (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <SidebarNav active={getActiveTab()} onNavigate={setScreen} />
          {mainContent}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          {mainContent}
        </div>
      )}

      {showNav && isMobile && (
        <BottomNav active={getActiveTab()} onNavigate={setScreen} />
      )}
    </div>
  );
}
