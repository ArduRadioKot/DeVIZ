import { useState } from "react";
import { Bell, Plus, Search } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
const CATEGORIES = ["Все", "Спорт", "Игры", "Культура", "Прогулки", "Еда", "Обучение", "Другое"];
import { ACCENT } from "../theme";
import { EventCard } from "../components/event-card";
import { SkeletonCard } from "../components/skeleton-card";
import * as s from "../constants/styles";
import type { Event } from "../types";

export { CreateEventScreen } from "./create-event";

export function FeedScreen({
  events,
  loading,
  onEventsChange,
  onCreateClick,
  onJoinEvent,
  onLeaveEvent,
  unreadNotifications,
  onNotificationsClick,
  userName,
}: {
  events: Event[];
  loading?: boolean;
  onEventsChange: (events: Event[]) => void;
  onCreateClick: () => void;
  onJoinEvent?: (event: Event) => void;
  onLeaveEvent?: (eventId: string) => void;
  unreadNotifications?: number;
  onNotificationsClick?: () => void;
  userName?: string;
}) {
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      event.activity.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === "Все" || event.category === selectedCategory;
    const matchesDistance = maxDistance === null || (event.distance !== undefined && event.distance <= maxDistance);
    return matchesSearch && matchesCategory && matchesDistance;
  });

  const handleJoin = (eventId: string) => {
    const nextJoined = new Set(joined);
    const isJoining = !nextJoined.has(eventId);

    const nextEvents = events.map((event) => {
      if (event.id !== eventId) return event;

      const nextCurrent = isJoining ? event.current + 1 : event.current - 1;

      return {
        ...event,
        current: nextCurrent,
        confirmed: nextCurrent >= event.needed,
      };
    });

    if (isJoining) {
      nextJoined.add(eventId);
      const event = events.find((e) => e.id === eventId);
      if (event && onJoinEvent) onJoinEvent(event);
    } else {
      nextJoined.delete(eventId);
      if (onLeaveEvent) onLeaveEvent(eventId);
    }

    setJoined(nextJoined);
    onEventsChange(nextEvents);
  };

  return (
    <div style={s.pageContainer}>
      <div style={{ ...s.flexBetween, padding: isMobile ? "16px 20px 12px" : "20px 32px 16px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <h2 style={{ fontFamily: s.FONT, fontWeight: 200, fontSize: isMobile ? 22 : 28, color: ACCENT, letterSpacing: -0.5 }}>
          DeVIZ
        </h2>
        <div style={{ display: "flex", gap: 16, marginLeft: isMobile ? 0 : "auto" }}>
          <button onClick={onNotificationsClick} style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}>
            <Bell size={isMobile ? 22 : 24} color="#374151" />
            {unreadNotifications && unreadNotifications > 0 ? (
              <div style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </div>
            ) : null}
          </button>
          <button onClick={onCreateClick} style={s.feedIconButton(isMobile ? 40 : 44)}>
            <Plus size={isMobile ? 20 : 22} color="#fff" />
          </button>
        </div>
      </div>

      <div style={{ padding: isMobile ? "12px 16px" : "16px 32px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <div style={s.flexRow}>
          <div style={{ ...s.flexRow, flex: 1, gap: 8, background: "#f3f4f6", padding: "10px 14px", borderRadius: 8 }}>
            <Search size={isMobile ? 18 : 20} color="#9ca3af" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск мероприятий..."
              style={{ ...s.field, border: "none", background: "none", padding: 0, fontSize: 16 }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? "8px 16px" : "12px 32px", background: "#fff", borderBottom: "1px solid #f3f4f6", overflowX: "auto", display: "flex", gap: 8 }}>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={s.categoryButton(selectedCategory === category, isMobile)}
          >
            {category}
          </button>
        ))}
      </div>

      <div style={s.scrollContainer(isMobile)}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
        ) : filteredEvents.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "#9ca3af", fontFamily: s.FONT, fontSize: 16 }}>
            {searchQuery || selectedCategory !== "Все" ? "Ничего не найдено" : "Пока нет мероприятий"}
          </div>
        ) : filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isJoined={joined.has(event.id)}
            userName={userName}
            onJoin={handleJoin}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}
