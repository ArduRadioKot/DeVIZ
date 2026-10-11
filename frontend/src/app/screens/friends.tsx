import { ArrowLeft, MessageCircle, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_LIGHT, ACCENT_MUTED } from "../theme";
import type { Friend, Screen } from "../types";

export function FriendsScreen({
  friends,
  onNavigate,
  onViewProfile,
  onWrite,
}: {
  friends: Friend[];
  onNavigate: (s: Screen) => void;
  onViewProfile: (friend: Friend) => void;
  onWrite: (friend: Friend) => void;
}) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [friends, query],
  );

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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={() => onNavigate("profile")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: isMobile ? 18 : 22, color: "#fff", margin: 0, flex: 1 }}>
            Друзья
          </h1>
          <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.15)", padding: "2px 10px", borderRadius: 8 }}>
            {friends.length}
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={16} color="rgba(255,255,255,0.5)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск друзей..."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 8,
              padding: "10px 12px 10px 36px",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 14,
              color: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb", padding: isMobile ? "12px 16px" : "24px 32px" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", fontFamily: "Montserrat, sans-serif", fontSize: 14, color: "#9ca3af" }}>
            {query ? "Ничего не найдено" : "Нет друзей"}
          </div>
        )}
        <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 12, overflow: "hidden" }}>
          {filtered.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <button
                onClick={() => onViewProfile(f)}
                style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, border: "none", background: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}
              >
                <img src={f.avatar} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt={f.name} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{f.name}</p>
                  {f.mutualEvents !== undefined && (
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
                      {f.mutualEvents} общих сборов
                    </p>
                  )}
                </div>
              </button>
              <button
                onClick={() => onWrite(f)}
                style={{ background: ACCENT_MUTED, border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
              >
                <MessageCircle size={14} color={ACCENT} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
