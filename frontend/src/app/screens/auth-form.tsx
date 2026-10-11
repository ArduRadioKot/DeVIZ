import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import * as authApi from "../api/auth";
import * as s from "../constants/styles";
import type { Screen } from "../types";
import { ACCENT, ACCENT_LIGHT } from "../theme";

export function AuthScreen({
  mode,
  onNavigate,
}: {
  mode: "login" | "register";
  onNavigate: (s: Screen) => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) { setError("Введите email"); return; }
    if (!password) { setError("Введите пароль"); return; }
    if (mode === "register") {
      if (!name.trim()) { setError("Введите имя"); return; }
      if (password !== password2) { setError("Пароли не совпадают"); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await authApi.login({ email: email.trim(), password });
      } else {
        await authApi.register({
          email: email.trim(),
          password,
          name: name.trim(),
        });
      }
      onNavigate("feed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    ...s.flexColumn,
    background: "#fff",
    position: "fixed",
    top: 0, left: 0,
    overflow: "hidden",
    ...s.flexCenter,
    padding: isMobile ? "0" : "40px",
    zIndex: 1000,
  };

  const containerStyle: React.CSSProperties = {
    padding: isMobile ? "70px 28px 40px" : "40px",
    flex: 1,
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: isMobile ? "100%" : "450px",
  };

  const errorBox: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: 14,
    fontFamily: s.FONT,
    marginBottom: 16,
  };

  const submitStyle: React.CSSProperties = {
    marginTop: 8,
    width: "100%",
    padding: "14px",
    borderRadius: 8,
    background: loading ? "#ccc" : ACCENT,
    border: "none",
    color: "#fff",
    fontFamily: s.FONT,
    fontWeight: 200,
    fontSize: 16,
    cursor: loading ? "not-allowed" : "pointer",
  };

  const toggleStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: ACCENT,
    fontFamily: s.FONT,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div style={pageStyle}>
      <div style={{
        position: "absolute",
        top: -60, right: -60,
        width: 220, height: 220,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ACCENT_LIGHT}55 0%, ${ACCENT}33 60%, transparent 80%)`,
      }} />

      <div style={containerStyle}>
        <button
          onClick={() => onNavigate("welcome")}
          style={{ ...s.ghostButton, marginBottom: 24, color: "#6b7280", ...s.flexRow, gap: 6 }}
        >
          <ArrowLeft size={18} />
        </button>

        <h1 style={{ fontFamily: s.FONT, fontWeight: 200, fontSize: 36, color: "#1a1a1a", marginBottom: 32 }}>
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        {error && <div style={errorBox}>{error}</div>}

        <div style={{ ...s.flexColumn, gap: 14 }}>
          <div>
            <label style={s.label}>Email</label>
            <input
              type="email"
              placeholder="Введите Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.field}
            />
          </div>

          {mode === "register" && (
            <div>
              <label style={s.label}>Имя</label>
              <input
                type="text"
                placeholder="Введите имя..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={s.field}
              />
            </div>
          )}

          <div>
            <label style={s.label}>Пароль</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Введите пароль..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...s.field, padding: "12px 42px 12px 14px" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", ...s.ghostButton, color: "#9ca3af" }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label style={s.label}>Повторите пароль</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass2 ? "text" : "password"}
                  placeholder="Повторите пароль..."
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  style={{ ...s.field, padding: "12px 42px 12px 14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass2(!showPass2)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", ...s.ghostButton, color: "#9ca3af" }}
                >
                  {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={submitStyle}
          >
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Регистрация"}
          </button>

          <p style={{ textAlign: "center", fontFamily: s.FONT, fontSize: 14, color: "#6b7280", marginTop: 8 }}>
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button onClick={() => onNavigate(mode === "login" ? "register" : "login")} style={toggleStyle}>
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
