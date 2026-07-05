import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import type { Screen } from "../types";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import { inputStyle, labelStyle } from "../constants/styles";

export function AuthScreen({
  mode,
  onNavigate,
}: {
  mode: "login" | "register";
  onNavigate: (s: Screen) => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "40px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT_LIGHT}55 0%, ${ACCENT}33 60%, transparent 80%)`,
        }}
      />

      <div
        style={{
          padding: isMobile ? "70px 28px 40px" : "40px",
          flex: 1,
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: isMobile ? "100%" : "450px",
        }}
      >
        <button
          onClick={() => onNavigate("welcome")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#6b7280",
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <h1
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 200,
            fontSize: 36,
            color: "#1a1a1a",
            marginBottom: 32,
          }}
        >
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" placeholder="Введите Email..." style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Пароль</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Введите пароль..."
                style={{ ...inputStyle, padding: "12px 42px 12px 14px" }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label style={labelStyle}>Повторите пароль</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass2 ? "text" : "password"}
                  placeholder="Повторите пароль..."
                  style={{ ...inputStyle, padding: "12px 42px 12px 14px" }}
                />
                <button
                  onClick={() => setShowPass2(!showPass2)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    display: "flex",
                  }}
                >
                  {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => onNavigate("feed")}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              background: ACCENT,
              border: "none",
              color: "#fff",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 200,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {mode === "login" ? "Войти" : "Регистрация"}
          </button>

          <p
            style={{
              textAlign: "center",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 14,
              color: "#6b7280",
              marginTop: 8,
            }}
          >
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button
              onClick={() => onNavigate(mode === "login" ? "register" : "login")}
              style={{
                background: "none",
                border: "none",
                color: ACCENT,
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
