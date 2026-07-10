export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Price {
  amount: number;
  currency: "RUB";
}

export interface CityBrief {
  id: string;
  name: string;
  region: string | null;
  timezone: string;
}

export interface City extends CityBrief {
  country_code: string;
  center: GeoPoint;
}

export interface UserBrief {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface ActivityParticipantsSummary {
  count: number;
  min: number;
  limit: number;
}

export interface ActivityViewerState {
  is_participant: boolean;
  role: "organizer" | "participant" | null;
  can_join: boolean;
  join_block_reason: string | null;
}

export interface ActivityListItem {
  id: string;
  title: string;
  category: string;
  level: string;
  city: CityBrief;
  address: string;
  location: GeoPoint;
  distance_m: number | null;
  starts_at: string;
  join_deadline: string;
  participants: ActivityParticipantsSummary;
  status: string;
  price: Price | null;
  viewer: ActivityViewerState;
}

export interface ActivityDetail extends ActivityListItem {
  organizer: UserBrief;
  description: string | null;
  timezone: string;
  duration_minutes: number;
}

export interface ActivityCreate {
  city_id: string;
  title: string;
  description?: string | null;
  category: string;
  level: string;
  address: string;
  location: GeoPoint;
  timezone: string;
  starts_at: string;
  duration_minutes: number;
  join_deadline: string;
  participants_min: number;
  participants_limit: number;
  price?: Price | null;
}

export interface Participant {
  user: UserBrief;
  role: "organizer" | "participant";
  joined_at: string;
}

export interface Page<T> {
  items: T[];
  next_cursor: string | null;
}

export interface MeProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  city: CityBrief | null;
  timezone: string;
}

export interface MeUpdate {
  name?: string;
  avatar_url?: string | null;
  city_id?: string;
  timezone?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  activity_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface ReadAllNotificationsResult {
  updated_count: number;
  unread_count: number;
}

export interface CatalogItem {
  code: string;
  title: string;
}

// Auth
export interface AuthRegister {
  email: string;
  password: string;
  name: string;
  city_id?: string;
  timezone?: string;
}

export interface AuthLogin {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: MeProfile;
}

// Friends
export interface Friend {
  id: string;
  name: string;
  avatar_url: string | null;
  mutual_events: number;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  user: UserBrief;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

// Chats
export interface ChatBrief {
  id: string;
  type: "event" | "direct";
  name: string;
  event_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  member_count: number;
  created_at: string;
}

export interface ChatDetail extends ChatBrief {
  members: Participant[];
}

export interface ChatCreate {
  type: "event" | "direct";
  name: string;
  member_ids: string[];
}

export interface MessageSend {
  text: string;
}

export interface MessageOut {
  id: string;
  chat_id: string;
  user: UserBrief;
  text: string;
  created_at: string;
}

// Places
export interface UserPlace {
  id: string;
  name: string;
  image_url: string | null;
  location: GeoPoint | null;
  created_at: string;
}

export interface UserPlaceCreate {
  name: string;
  image_url?: string | null;
  location?: GeoPoint | null;
}
