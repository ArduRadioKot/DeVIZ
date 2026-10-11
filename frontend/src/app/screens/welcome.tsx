import { Globe } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import type { Screen } from "../types";
import { ACCENT, ACCENT_LIGHT } from "../theme";

export function WelcomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(160deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 55%, #a8e4d8 100%)`,
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        padding: isMobile ? "60px 28px 48px" : "40px 56px",
        zIndex: 1000,
        gap: isMobile ? 36 : 72,
      }}
    >
      {[
        { w: 280, h: 280, top: "25%", left: "30%", op: 0.15 },
        { w: 220, h: 220, top: "35%", left: "15%", op: 0.12 },
        { w: 170, h: 170, top: "48%", left: "45%", op: 0.1 },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: c.w,
            height: c.h,
            borderRadius: "50%",
            border: `2px solid rgba(255,255,255,${c.op * 3})`,
            background: `rgba(255,255,255,${c.op})`,
            top: c.top,
            left: c.left,
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          maxWidth: isMobile ? "100%" : 560,
          minWidth: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 200,
            fontSize: isMobile ? 52 : 72,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: -1,
            marginBottom: 12,
          }}
        >
          DeVIZ
        </h1>
        <p
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: isMobile ? 16 : 20,
            color: "rgba(255,255,255,0.85)",
            fontWeight: 200,
            maxWidth: 500,
          }}
        >
          Находи компанию для спорта и активностей рядом
        </p>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: isMobile ? "none" : "0 0 320px",
          width: isMobile ? "100%" : 320,
          minWidth: 0,
        }}
      >
        <button
          onClick={() => onNavigate("register")}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.25)",
            border: "1.5px solid rgba(255,255,255,0.5)",
            color: "#fff",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 200,
            fontSize: 16,
            marginBottom: 12,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          Регистрация
        </button>
        <button
          onClick={() => onNavigate("login")}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.15)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            color: "#fff",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 200,
            fontSize: 16,
            marginBottom: 24,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          Вход
        </button>
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          <button
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Globe size={14} /> выбрать язык
          </button>
        </div>
      </div>
    </div>
  );
}
