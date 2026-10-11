import { ArrowLeft, Users } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import type { ChatParticipant, Screen } from "../types";

export function ChatParticipantsScreen({
  participants,
  chatName,
  onNavigate,
  onViewProfile,
}: {
  participants: ChatParticipant[];
  chatName: string;
  onNavigate: (s: Screen) => void;
  onViewProfile: (participant: ChatParticipant) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
          padding: isMobile ? "44px 20px 16px" : "24px 32px 20px",
          borderBottomLeftRadius: isMobile ? 20 : 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => onNavigate("chats")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <div>
            <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: isMobile ? 18 : 22, color: "#fff", margin: 0 }}>
              {chatName}
            </h1>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "2px 0 0" }}>
              {participants.length} {participants.length === 1 ? "участник" : "участников"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb", padding: isMobile ? "12px 16px" : "24px 32px" }}>
        <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 12, overflow: "hidden" }}>
          {participants.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onViewProfile(p)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                border: "none",
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: i < participants.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <img
                src={p.avatar}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                alt={p.name}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>
                  {p.name}
                </p>
              </div>
              {p.role && (
                <span style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 11,
                  color: p.role === "organizer" ? ACCENT : "#6b7280",
                  fontWeight: 600,
                  background: p.role === "organizer" ? "#eef7f5" : "#f3f4f6",
                  padding: "3px 10px",
                  borderRadius: 6,
                }}>
                  {p.role === "organizer" ? "Организатор" : p.role === "admin" ? "Админ" : "Участник"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
