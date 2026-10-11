import { useState } from "react";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_MUTED } from "../theme";
import type { Screen, UserProfile } from "../types";

export function EditProfileScreen({
  profile,
  onSave,
  onNavigate,
}: {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onNavigate: (s: Screen) => void;
}) {
  const isMobile = useIsMobile();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({ name: name.trim() || profile.name, username: username.trim() || profile.username, avatar: avatar.trim() || profile.avatar });
    onNavigate("profile");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f9fafb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "48px 20px 16px" : "20px 24px 16px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <button onClick={() => onNavigate("profile")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <ArrowLeft size={isMobile ? 22 : 24} color="#374151" />
        </button>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 26, color: "#111827", margin: 0, flex: 1 }}>
          Редактировать профиль
        </h1>
        <button onClick={handleSave} style={{ background: ACCENT, border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Save size={14} /> Сохранить
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 0" : "24px 32px" }}>
        <div style={{ background: "#fff", borderRadius: isMobile ? 0 : 12, padding: isMobile ? "20px 20px" : "24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img src={avatar || profile.avatar} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${ACCENT_MUTED}` }} alt="avatar" />
            <div style={{ display: "flex", gap: 6, width: "100%", maxWidth: 320 }}>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Ссылка на фото"
                style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 12px", fontFamily: "Montserrat, sans-serif", fontSize: 13, outline: "none" }}
              />
              <label style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <Camera size={14} /> Файл
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          <Field label="Имя" value={name} onChange={setName} placeholder="Ваше имя" />
          <Field label="Username" value={username} onChange={setUsername} placeholder="@username" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 4, display: "block" }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", background: "#f3f4f6", border: "none", borderRadius: 8, padding: "12px 14px", fontFamily: "Montserrat, sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}
