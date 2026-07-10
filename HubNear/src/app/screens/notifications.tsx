import { ArrowLeft, Bell, Check, Clock, Trophy, UserPlus } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_MUTED } from "../theme";
import type { NotificationItem, Screen } from "../types";

const TYPE_CONFIG = {
  quorum: { icon: Trophy, bg: "#fef3c7", color: "#d97706" },
  deadline: { icon: Clock, bg: "#fee2e2", color: "#dc2626" },
  join: { icon: UserPlus, bg: "#dbeafe", color: "#2563eb" },
  system: { icon: Bell, bg: "#f3f4f6", color: "#6b7280" },
};

export function NotificationsScreen({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (s: Screen) => void;
}) {
  const isMobile = useIsMobile();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f9fafb" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: isMobile ? "48px 20px 16px" : "20px 24px 16px",
          background: "#fff",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <button onClick={() => onNavigate("profile")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={isMobile ? 22 : 24} color="#374151" />
        </button>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 26, color: "#111827", margin: 0, flex: 1 }}>
          Уведомления
        </h1>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{
              background: "none",
              border: "none",
              color: ACCENT,
              fontFamily: "Montserrat, sans-serif",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Check size={14} />
            Прочитать все
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "8px 0" : "24px 32px" }}>
        {notifications.length === 0 && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Bell size={40} color="#d1d5db" />
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontSize: 14, marginTop: 8 }}>Нет уведомлений</p>
          </div>
        )}
        <div
          style={{
            background: "#fff",
            borderRadius: isMobile ? 0 : 12,
            overflow: "hidden",
          }}
        >
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: isMobile ? "14px 20px" : "16px 24px",
                  border: "none",
                  background: n.read ? "#fff" : "#f0fdfa",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                  textAlign: "left",
                  opacity: n.read ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: cfg.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: n.read ? 500 : 700, fontSize: 14, color: "#111827", margin: 0 }}>
                    {n.title}
                  </p>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#6b7280", margin: "3px 0 0" }}>{n.body}</p>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>{n.time}</p>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, flexShrink: 0, marginTop: 8 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
