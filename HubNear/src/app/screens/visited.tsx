import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useIsMobile } from "../components/ui/use-mobile";
import { EventCard } from "../components/event-card";
import * as s from "../constants/styles";
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

  return (
    <div style={{ ...s.pageContainer, background: "#f0f2f5" }}>
      <div style={{ ...s.headerRow, padding: isMobile ? "48px 20px 16px" : "20px 24px 16px" }}>
        <button onClick={() => onNavigate("profile")} style={s.backButton}>
          <ArrowLeft size={isMobile ? 22 : 24} color="#374151" />
        </button>
        <h1 style={{ ...s.screenTitle, fontSize: isMobile ? 22 : 26 }}>
          Посещённые сборы
        </h1>
        <span style={{ ...s.mutedText, fontSize: 13, marginLeft: "auto" }}>{visited.length}</span>
      </div>

      <div style={s.scrollContainer(isMobile)}>
        {visited.length === 0 && (
          <div style={s.emptyState}>
            <p style={{ fontFamily: s.FONT, color: "#9ca3af", fontSize: 14 }}>Вы ещё не посетили ни одного сбора</p>
          </div>
        )}
        {visited.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}
