import { Home, MessageCircle, Settings, User } from "lucide-react";
import type { Screen } from "../types";
import { ACCENT, ACCENT_MUTED } from "../theme";

const TABS: { id: Screen; Icon: typeof Home; label: string }[] = [
  { id: "feed", Icon: Home, label: "Сборы" },
  { id: "chats", Icon: MessageCircle, label: "Чаты" },
  { id: "profile", Icon: User, label: "Профиль" },
];

export function BottomNav({
  active,
  onNavigate,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #e5e7eb",
        background: "#fff",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        position: "sticky",
        bottom: 0,
        zIndex: 100,
      }}
    >
      {TABS.map(({ id, Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 0 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              gap: 2,
            }}
          >
            <Icon size={22} color={isActive ? ACCENT : "#9ca3af"} />
            <span
              style={{
                fontSize: 10,
                color: isActive ? ACCENT : "#9ca3af",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SidebarNav({
  active,
  onNavigate,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
      }}
    >
      <h2
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 200,
          fontSize: 28,
          color: ACCENT,
          letterSpacing: -0.5,
          marginBottom: 32,
          paddingLeft: 12,
        }}
      >
        DeVIZ
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {TABS.map(({ id, Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 8,
                background: isActive ? ACCENT_MUTED : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Icon size={20} color={isActive ? ACCENT : "#6b7280"} />
              <span
                style={{
                  fontSize: 15,
                  color: isActive ? ACCENT : "#374151",
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => onNavigate("settings")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderRadius: 8,
          background: active === "settings" ? ACCENT_MUTED : "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Settings size={20} color={active === "settings" ? ACCENT : "#6b7280"} />
        <span
          style={{
            fontSize: 15,
            color: active === "settings" ? ACCENT : "#374151",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: active === "settings" ? 700 : 500,
          }}
        >
          Настройки
        </span>
      </button>
    </aside>
  );
}
