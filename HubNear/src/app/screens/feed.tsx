import { useState } from "react";
import { Bell, CalendarDays, Clock, MapPin, Plus, Search, Timer, Zap } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { CATEGORIES } from "../data/events";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import type { Event } from "../types";

export { CreateEventScreen } from "./create-event";

export function FeedScreen({
  events,
  onEventsChange,
  onCreateClick,
  onJoinEvent,
  onLeaveEvent,
  unreadNotifications,
  onNotificationsClick,
  userName,
}: {
  events: Event[];
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

  const formatDistance = (km?: number) => {
    if (km === undefined) return null;
    return km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
  };

  const getDeadlineLabel = (event: Event) => {
    if (!event.deadlineTime) return `до ${event.deadline}`;
    const diff = event.deadlineTime - Date.now();
    if (diff <= 0) return "Набор окончен";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
    return `до ${event.deadline}`;
  };

  const getDeadlineUrgency = (event: Event) => {
    if (!event.deadlineTime) return 0;
    const diff = event.deadlineTime - Date.now();
    if (diff <= 0) return 2;
    if (diff < 3600000) return 1;
    return 0;
  };

  const urgencyColors = ["rgba(255,255,255,0.9)", "#fbbf24", "#ef4444"];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#f0f2f5",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "16px 20px 12px" : "20px 32px 16px",
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <h2
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 200,
            fontSize: isMobile ? 22 : 28,
            color: ACCENT,
            letterSpacing: -0.5,
          }}
        >
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
          <button
            onClick={onCreateClick}
            style={{
              background: ACCENT,
              border: "none",
              borderRadius: "50%",
              width: isMobile ? 40 : 44,
              height: isMobile ? 40 : 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={isMobile ? 20 : 22} color="#fff" />
          </button>
        </div>
      </div>

      <div
        style={{
          padding: isMobile ? "12px 16px" : "16px 32px",
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f3f4f6",
            padding: "10px 14px",
            borderRadius: 8,
          }}
        >
          <Search size={isMobile ? 18 : 20} color="#9ca3af" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск мероприятий..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 16,
              color: "#374151",
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: isMobile ? "8px 16px" : "12px 32px",
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
          overflowX: "auto",
          display: "flex",
          gap: 8,
        }}
      >
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: isMobile ? "6px 14px" : "8px 16px",
              borderRadius: 10,
              background: selectedCategory === category ? ACCENT : "#f3f4f6",
              border: "none",
              color: selectedCategory === category ? "#fff" : "#374151",
              fontFamily: "Montserrat, sans-serif",
              fontSize: isMobile ? 13 : 14,
              fontWeight: selectedCategory === category ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {category}
          </button>
        ))}
      </div>



      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "12px 14px 0" : "24px 22px",
          display: isMobile ? "flex" : "grid",
          flexDirection: isMobile ? "column" : "row",
          gridTemplateColumns: isMobile ? undefined : "repeat(auto-fill, minmax(280px, 1fr))",
          alignContent: "flex-start",
          gap: 0,
          paddingBottom: isMobile ? 80 : 32,
        }}
      >
        {filteredEvents.map((event) => {
          const isJoined = joined.has(event.id);
          const spotsLeft = event.needed - event.current;
          const progress = (event.current / event.needed) * 100;
          const urgency = getDeadlineUrgency(event);

          return (
            <div
              key={event.id}
              style={{
                padding: isMobile ? "0 0 16px 0" : "12px",
                boxSizing: "border-box",
              }}
            >
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
                aspectRatio: isMobile ? "1 / 1.15" : "1 / 1.1",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {event.image ? (
                <img
                  src={event.image}
                  alt="event"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CalendarDays size={48} color="#fff" style={{ opacity: 0.3 }} />
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  padding: isMobile ? "12px 14px 40px" : "14px 16px 44px",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 16 : 18, color: "#fff", margin: "0 0 4px" }}>
                    {event.activity}
                  </h3>
                  {event.confirmed && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(17, 111, 95, 0.9)",
                      padding: "3px 8px",
                      borderRadius: 8,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#fff", fontWeight: 600 }}>
                        Подтверждено
                      </span>
                    </div>
                  )}
                </div>
                <img
                  src={event.avatar}
                  style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }}
                  alt={event.organizer}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: isMobile ? "40px 14px 14px" : "44px 16px 16px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
                }}
              >
                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={isMobile ? 14 : 16} color="#fff" />
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#fff" }}>{event.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={isMobile ? 14 : 16} color="#fff" />
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#fff" }}>{event.location}</span>
                    {!isMobile && event.distance !== undefined && (
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 10 : 11, color: "rgba(255,255,255,0.7)", marginLeft: 2 }}>
                        {formatDistance(event.distance)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Zap size={isMobile ? 14 : 16} color="#fff" />
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "rgba(255,255,255,0.9)" }}>{event.level}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Timer size={isMobile ? 14 : 16} color={urgencyColors[urgency]} />
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: urgencyColors[urgency] }}>
                      {getDeadlineLabel(event)}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.85)" }}>
                      Кворум: {event.current}/{event.needed}
                    </span>
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: isMobile ? 11 : 12, color: spotsLeft <= 0 ? "#86efac" : "#fbbf24" }}>
                      {spotsLeft <= 0 ? "Набор завершён" : `нужно ещё ${spotsLeft}`}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "rgba(255,255,255,0.3)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(progress, 100)}%`,
                        background: event.confirmed ? "#86efac" : progress >= 100 ? "#22c55e" : ACCENT_LIGHT,
borderRadius: 2,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {event.organizer === userName ? (
                  <div style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 600,
                    fontSize: isMobile ? 13 : 14,
                    textAlign: "center",
                  }}>
                    Ваше мероприятие
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(event.id)}
                    disabled={spotsLeft <= 0 && !isJoined}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      background: isJoined ? "rgba(255,255,255,0.2)" : spotsLeft <= 0 ? "rgba(255,255,255,0.15)" : ACCENT,
                      border: isJoined ? "1px solid rgba(255,255,255,0.4)" : "none",
                      color: "#fff",
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: isMobile ? 13 : 14,
                      cursor: spotsLeft <= 0 && !isJoined ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {isJoined ? "Отменить" : spotsLeft <= 0 ? "Мест нет" : "Присоединиться"}
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
