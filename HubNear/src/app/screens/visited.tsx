import { ArrowLeft, CalendarDays, Clock, MapPin, Timer, Zap } from "lucide-react";
import { useMemo } from "react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import type { Event, Screen } from "../types";

export function VisitedEventsScreen({
  events,
  joinedEventIds,
  onNavigate,
}: {
  events: Event[];
  joinedEventIds: Set<string>;
  onNavigate: (s: Screen) => void;
}) {
  const isMobile = useIsMobile();

  const visited = useMemo(
    () => events.filter((e) => joinedEventIds.has(e.id)),
    [events, joinedEventIds],
  );

  const formatDistance = (km?: number) => {
    if (km === undefined) return null;
    return km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f0f2f5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "48px 20px 16px" : "20px 24px 16px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <button onClick={() => onNavigate("profile")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={isMobile ? 22 : 24} color="#374151" />
        </button>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 26, color: "#111827", margin: 0 }}>
          Посещённые сборы
        </h1>
        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#9ca3af", marginLeft: "auto" }}>{visited.length}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 14px 24px" : "24px 22px 32px", display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : "row", gridTemplateColumns: isMobile ? undefined : "repeat(auto-fill, minmax(280px, 1fr))", alignContent: "flex-start", gap: 0 }}>
        {visited.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", width: "100%" }}>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontSize: 14 }}>Вы ещё не посетили ни одного сбора</p>
          </div>
        )}
        {visited.map((event) => {
          const spotsLeft = event.needed - event.current;
          const progress = (event.current / event.needed) * 100;

          return (
            <div key={event.id} style={{ padding: isMobile ? "0 0 16px 0" : "12px", boxSizing: "border-box" }}>
              <div style={{ borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: isMobile ? "1 / 1.15" : "1 / 1.1", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", width: "100%" }}>
                {event.image ? (
                  <img src={event.image} alt="event" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CalendarDays size={48} color="#fff" style={{ opacity: 0.3 }} />
                  </div>
                )}

                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: isMobile ? "12px 14px 40px" : "14px 16px 44px", background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 16 : 18, color: "#fff", margin: "0 0 4px" }}>{event.activity}</h3>
                    {event.confirmed && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(17, 111, 95, 0.9)", padding: "3px 8px", borderRadius: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#fff", fontWeight: 600 }}>Подтверждено</span>
                      </div>
                    )}
                  </div>
                  <img src={event.avatar} style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} alt={event.organizer} />
                </div>

                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "40px 14px 14px" : "44px 16px 16px", background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)" }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Clock size={isMobile ? 14 : 16} color="#fff" />
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#fff" }}>{event.time}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={isMobile ? 14 : 16} color="#fff" />
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#fff" }}>{event.location}</span>
                      {event.distance !== undefined && (
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 10 : 11, color: "rgba(255,255,255,0.7)", marginLeft: 2 }}>{formatDistance(event.distance)}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Zap size={isMobile ? 14 : 16} color="#fff" />
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "rgba(255,255,255,0.9)" }}>{event.level}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Timer size={isMobile ? 14 : 16} color="#fff" />
                      <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "rgba(255,255,255,0.9)" }}>до {event.deadline}</span>
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
                    <div style={{ height: 6, background: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(progress, 100)}%`, background: event.confirmed ? "#86efac" : progress >= 100 ? "#22c55e" : ACCENT_LIGHT, borderRadius: 2, transition: "width 0.3s ease" }} />
                    </div>
                  </div>

                  <div style={{ textAlign: "center", padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: isMobile ? 13 : 14 }}>
                    Вы участвовали
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
