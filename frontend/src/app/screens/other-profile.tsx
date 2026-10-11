import { ArrowLeft, Mail, UserCheck, UserPlus } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import type { ChatParticipant, Screen } from "../types";

export function OtherProfileScreen({
  user,
  onNavigate,
  isFriend,
  onAddFriend,
  onSendMessage,
}: {
  user: ChatParticipant | null;
  onNavigate: (s: Screen) => void;
  isFriend?: boolean;
  onAddFriend?: () => void;
  onSendMessage?: () => void;
}) {
  const isMobile = useIsMobile();

  if (!user) return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
          padding: isMobile ? "44px 20px 24px" : "60px 32px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          position: "relative",
        }}
      >
        <button
          onClick={() => onNavigate("chats")}
          style={{ position: "absolute", top: isMobile ? 46 : 60, left: isMobile ? 20 : 32, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ArrowLeft size={18} color="#fff" />
        </button>

        <div style={{ marginTop: 8 }}>
          <img
            src={user.avatar}
            style={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100, borderRadius: "50%", border: "3px solid #fff", objectFit: "cover" }}
            alt={user.name}
          />
        </div>

        <h2 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 20 : 24, color: "#fff", margin: 0 }}>
          {user.name}
        </h2>

        <div style={{ display: "flex", gap: isMobile ? 24 : 32, marginTop: 8 }}>
          {[{ label: "Сборы", val: "8" }, { label: "Друзья", val: "56" }, { label: "Участников", val: "34" }].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 18 : 20, color: "#fff", margin: 0 }}>{s.val}</p>
              <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {onSendMessage && (
            <button
              onClick={onSendMessage}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Mail size={14} /> Написать
            </button>
          )}
          {onAddFriend && (
            <button
              onClick={onAddFriend}
              style={{
                background: isFriend ? "rgba(255,255,255,0.15)" : "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                color: isFriend ? "#fff" : ACCENT,
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isFriend ? <><UserCheck size={14} /> В друзьях</> : <><UserPlus size={14} /> Добавить</>}
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb", padding: isMobile ? "16px 16px" : "24px 32px" }}>
        <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 12, padding: isMobile ? "14px 16px" : "20px 24px" }}>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", margin: "0 0 12px" }}>О пользователе</p>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
            Активный участник сообщества. Любит спорт и активный отдых.
          </p>
        </div>

        <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 12, padding: isMobile ? "14px 16px" : "20px 24px", marginTop: 12 }}>
          <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", margin: "0 0 12px" }}>Активности</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Волейбол", "Футбол", "Походы"].map((a) => (
              <span key={a} style={{ background: "#eef7f5", color: ACCENT, padding: "4px 12px", borderRadius: 8, fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 600 }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
