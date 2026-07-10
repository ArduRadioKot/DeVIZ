import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT } from "../theme";
import type { Screen } from "../types";

export function ChangePasswordScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = current.length > 0 && newPass.length >= 6 && newPass === confirm;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSuccess(true);
    setTimeout(() => onNavigate("profile"), 1500);
  };

  if (success) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={24} color="#fff" />
        </div>
        <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 16, color: "#111827", margin: 0 }}>Пароль изменён</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f9fafb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "48px 20px 16px" : "20px 24px 16px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <button onClick={() => onNavigate("profile")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={isMobile ? 22 : 24} color="#374151" />
        </button>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 26, color: "#111827", margin: 0 }}>
          Сменить пароль
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 0" : "24px 32px" }}>
        <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 12, padding: isMobile ? "20px" : "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <PasswordField label="Текущий пароль" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent((s) => !s)} />
          <PasswordField label="Новый пароль" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew((s) => !s)} hint="Минимум 6 символов" />
          <PasswordField label="Подтвердите пароль" value={confirm} onChange={setConfirm} />
          {confirm && newPass !== confirm && (
            <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#ef4444", margin: 0 }}>Пароли не совпадают</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              marginTop: 8,
              width: "100%",
              background: canSubmit ? ACCENT : "#d1d5db",
              border: "none",
              borderRadius: 6,
              padding: "14px",
              color: "#fff",
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, hint }: { label: string; value: string; onChange: (v: string) => void; show?: boolean; onToggle?: () => void; hint?: string }) {
  return (
    <div>
      <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 4, display: "block" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", background: "#f3f4f6", borderRadius: 6, padding: "0 12px" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          style={{ flex: 1, background: "none", border: "none", padding: "12px 0", fontFamily: "Montserrat, sans-serif", fontSize: 14, outline: "none" }}
        />
        {onToggle && (
          <button type="button" onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            {show ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}
