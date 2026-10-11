import { ArrowLeft, Bell, Globe, Moon, Shield, Smartphone, Volume2 } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT } from "../theme";
import type { Screen } from "../types";

const SETTINGS_ITEMS = [
  { icon: Bell, label: "Уведомления", desc: "Напоминания о сборах, новые сообщения" },
  { icon: Volume2, label: "Звук", desc: "Звуковые сигналы и вибрация" },
  { icon: Moon, label: "Тёмная тема", desc: "Скоро" },
  { icon: Globe, label: "Язык", desc: "Русский" },
  { icon: Shield, label: "Конфиденциальность", desc: "Кто видит ваш профиль" },
  { icon: Smartphone, label: "О приложении", desc: "DeVIZ v0.0.1" },
];

export function SettingsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const isMobile = useIsMobile();

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
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 26, color: "#111827", margin: 0 }}>
          Настройки
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "8px 0" : "24px 32px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: isMobile ? 0 : 12,
            overflow: "hidden",
          }}
        >
          {SETTINGS_ITEMS.map(({ icon: Icon, label, desc }) => (
            <button
              key={label}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: isMobile ? "14px 20px" : "16px 24px",
                border: "none",
                background: "#fff",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: ACCENT + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color={ACCENT} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{label}</p>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
