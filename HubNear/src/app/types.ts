export type Screen =
  | "welcome"
  | "register"
  | "login"
  | "feed"
  | "profile"
  | "chats"
  | "create"
  | "settings"
  | "notifications"
  | "edit-profile"
  | "change-password"
  | "visited"
  | "chat-participants"
  | "other-profile"
  | "friends";

export type UserProfile = {
  name: string;
  username: string;
  avatar: string;
};

export type Event = {
  id: string;
  activity: string;
  category: string;
  time: string;
  location: string;
  needed: number;
  current: number;
  level: string;
  deadline: string;
  deadlineTime?: number;
  organizer: string;
  avatar: string;
  confirmed: boolean;
  image?: string;
  distance?: number;
};

export type ChatItem = {
  id: string;
  name: string;
  avatar: string;
  last: string;
  time: string;
  unread: number;
  group: boolean;
  eventId?: string;
};

export type Message = {
  id: string;
  chatId: string;
  fromMe: boolean;
  text: string;
  time: string;
};

export type Place = {
  id: string;
  name: string;
  img: string;
};

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  mutualEvents?: number;
};

export type ChatParticipant = {
  id: string;
  name: string;
  avatar: string;
  role?: "organizer" | "admin" | "member";
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "quorum" | "deadline" | "join" | "system";
};
