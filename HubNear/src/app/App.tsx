import { BottomNav, SidebarNav } from "./components/navigation";
import { useHubData } from "./hooks/useHubData";
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
import type { ChatParticipant } from "./types";

export default function App() {
  const {
    screen, setScreen,
    events,
    chats, messages,
    notifications,
    myPlaces,
    userProfile,
    joinedEventIds,
    friends,
    activeChatId,
    isApiAvailable,
    apiLoading,
    isMobile,
    unreadNotifications,
    currentParticipants,
    currentChatName,
    handleCreateEvent,
    handleJoinEvent,
    handleLeaveEvent,
    handleSendMessage,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleAddPlace,
    handleRemovePlace,
    handleUpdateProfile,
    isFriend,
    handleAddFriend,
    handleSendMessageTo,
    handleViewParticipants,
    selectedUser,
    prevScreen,
  } = useHubData();

  const showNav = ["feed", "chats", "profile"].includes(screen);

  const getActiveTab = (): string => {
    if (screen === "feed") return "feed";
    if (screen === "chats") return "chats";
    if (screen === "profile") return "profile";
    return "feed";
  };

  const mainContent = (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minWidth: 0,
    }}>
      {screen === "welcome" && <WelcomeScreen onNavigate={setScreen} />}
      {screen === "register" && <AuthScreen mode="register" onNavigate={setScreen} />}
      {screen === "login" && <AuthScreen mode="login" onNavigate={setScreen} />}
      {screen === "feed" && (
        <FeedScreen
          events={events}
          loading={apiLoading}
          onEventsChange={(e) => {}}
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
          onViewFriendProfile={(f) => {}}
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
      {screen === "other-profile" && selectedUser && (
        <OtherProfileScreen
          user={selectedUser}
          onNavigate={(s) => {
            if (s === "chats") setScreen(prevScreen);
            else setScreen(s);
          }}
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
          onViewProfile={(f) =>
            setScreen("other-profile")
          }
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
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}>
          {mainContent}
        </div>
      )}

      {showNav && isMobile && (
        <BottomNav active={getActiveTab()} onNavigate={setScreen} />
      )}
    </div>
  );
}
