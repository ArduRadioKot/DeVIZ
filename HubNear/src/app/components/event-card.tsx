import { CalendarDays, Clock, MapPin, Timer, Zap } from "lucide-react";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import type { Event } from "../types";
import * as s from "../constants/styles";

function formatDistance(km?: number) {
  if (km === undefined) return null;
  return km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
}

function getDeadlineLabel(event: Event) {
  if (!event.deadlineTime) return `до ${event.deadline}`;
  const diff = event.deadlineTime - Date.now();
  if (diff <= 0) return "Набор окончен";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`;
  return `до ${event.deadline}`;
}

function getDeadlineUrgency(event: Event) {
  if (!event.deadlineTime) return 0;
  const diff = event.deadlineTime - Date.now();
  if (diff <= 0) return 2;
  if (diff < 3600000) return 1;
  return 0;
}

const urgencyColors = ["rgba(255,255,255,0.9)", "#fbbf24", "#ef4444"];

export function EventCard({
  event,
  isJoined,
  userName,
  onJoin,
  isMobile,
}: {
  event: Event;
  isJoined?: boolean;
  userName?: string;
  onJoin?: (eventId: string) => void;
  isMobile: boolean;
}) {
  const spotsLeft = event.needed - event.current;
  const progress = (event.current / event.needed) * 100;
  const urgency = getDeadlineUrgency(event);

  return (
    <div key={event.id} style={{ padding: isMobile ? "0 0 16px 0" : "12px", boxSizing: "border-box" }}>
      <div style={{ ...s.cardShadow, aspectRatio: isMobile ? "1 / 1.15" : "1 / 1.1", cursor: "pointer" }}>
        {event.image ? (
          <img src={event.image} alt="event" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`, ...s.flexCenter }}>
            <CalendarDays size={48} color="#fff" style={{ opacity: 0.3 }} />
          </div>
        )}

        <div style={{ ...s.gradientTop, padding: isMobile ? "12px 14px 40px" : "14px 16px 44px" }}>
          <div>
            <h3 style={{ ...s.eventCardTitle, fontSize: isMobile ? 16 : 18 }}>
              {event.activity}
            </h3>
            {event.confirmed && (
              <div style={s.confirmedBadge}>
                <div style={s.confirmedDot} />
                <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#fff", fontWeight: 600 }}>Подтверждено</span>
              </div>
            )}
          </div>
          <img src={event.avatar} style={s.avatarStyle(isMobile)} alt={event.organizer} />
        </div>

        <div style={{ ...s.gradientBottom, padding: isMobile ? "40px 14px 14px" : "44px 16px 16px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={s.flexRow}>
              <Clock size={isMobile ? 14 : 16} color="#fff" />
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#fff", marginLeft: 5 }}>{event.time}</span>
            </div>
            <div style={s.flexRow}>
              <MapPin size={isMobile ? 14 : 16} color="#fff" />
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#fff", marginLeft: 5 }}>{event.location}</span>
              {!isMobile && event.distance !== undefined && (
                <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 10 : 11, color: "rgba(255,255,255,0.7)", marginLeft: 2 }}>
                  {formatDistance(event.distance)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={s.flexRow}>
              <Zap size={isMobile ? 14 : 16} color="#fff" />
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "rgba(255,255,255,0.9)", marginLeft: 5 }}>{event.level}</span>
            </div>
            <div style={s.flexRow}>
              <Timer size={isMobile ? 14 : 16} color={urgencyColors[urgency]} />
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: urgencyColors[urgency], marginLeft: 5 }}>
                {getDeadlineLabel(event)}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={s.flexBetween}>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.85)" }}>
                Кворум: {event.current}/{event.needed}
              </span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: isMobile ? 11 : 12, color: spotsLeft <= 0 ? "#86efac" : "#fbbf24" }}>
                {spotsLeft <= 0 ? "Набор завершён" : `нужно ещё ${spotsLeft}`}
              </span>
            </div>
            <div style={s.progressTrack}>
              <div style={s.progressFill(event.confirmed, progress)} />
            </div>
          </div>

          {userName === undefined ? (
            <div style={{ textAlign: "center", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: isMobile ? 13 : 14 }}>
              Вы участвовали
            </div>
          ) : event.organizer === userName ? (
            <div style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.8)", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: isMobile ? 13 : 14, textAlign: "center" }}>
              Ваше мероприятие
            </div>
          ) : (
            <button
              onClick={() => onJoin?.(event.id)}
              disabled={spotsLeft <= 0 && !isJoined}
              style={s.joinButton(!!isJoined, spotsLeft)}
            >
              {isJoined ? "Отменить" : spotsLeft <= 0 ? "Мест нет" : "Присоединиться"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
