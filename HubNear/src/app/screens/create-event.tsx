import { useRef, useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
const CATEGORIES = ["Все", "Спорт", "Игры", "Культура", "Прогулки", "Еда", "Обучение", "Другое"];
import { ACCENT } from "../theme";
import * as s from "../constants/styles";
import type { Event, Screen } from "../types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: "Montserrat, sans-serif", fontSize: 14, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

export function CreateEventScreen({
  onNavigate,
  onCreate,
}: {
  onNavigate: (s: Screen) => void;
  onCreate: (event: Event) => void;
}) {
  const [activity, setActivity] = useState("");
  const [category, setCategory] = useState("Спорт");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [needed, setNeeded] = useState("");
  const [level, setLevel] = useState("Любой");
  const [deadline, setDeadline] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!activity || !time || !location || !needed || !deadline) return;

    onCreate({
      id: Date.now().toString(),
      activity,
      category,
      time,
      location,
      needed: Number.parseInt(needed, 10),
      current: 1,
      level,
      deadline,
      deadlineTime: Date.now(),
      organizer: "Вы",
      avatar: "https://i.pravatar.cc/150?img=5",
      confirmed: false,
      image: filePreview || imageUrl || undefined,
    });

    onNavigate("feed");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f9fafb" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 20px 12px" : "20px 32px 16px", background: "#fff", borderBottom: "1px solid #f3f4f6" }}>
        <button onClick={() => onNavigate("feed")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={isMobile ? 22 : 24} color="#374151" />
        </button>
        <h2 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 28, color: ACCENT, letterSpacing: -0.5 }}>Создать сбор</h2>
        <div style={{ width: isMobile ? 24 : 32 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 20px" : "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          <Field label="Активность *"><input type="text" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Например: Волейбол" style={s.field} /></Field>
          <Field label="Категория *"><select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...s.field, background: "#fff" }}>{CATEGORIES.filter((c) => c !== "Все").map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></Field>
          <Field label="Время *"><input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="Например: Сегодня 19:00" style={s.field} /></Field>
          <Field label="Место *"><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Например: Парк Горького" style={s.field} /></Field>
          <Field label="Нужно участников *"><input type="number" value={needed} onChange={(e) => setNeeded(e.target.value)} placeholder="Например: 12" style={s.field} /></Field>
          <Field label="Уровень"><select value={level} onChange={(e) => setLevel(e.target.value)} style={{ ...s.field, background: "#fff" }}><option value="Любой">Любой</option><option value="Любительский">Любительский</option><option value="Средний">Средний</option><option value="Продвинутый">Продвинутый</option></select></Field>
          <Field label="Набор до *"><input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Например: 17:30" style={s.field} /></Field>
          <Field label="Изображение">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...s.field,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                  background: filePreview ? "#e6f7f4" : "#f9fafb",
                  border: filePreview ? "1px solid #116F5F" : "1px solid #e5e7eb",
                  color: filePreview ? "#116F5F" : "#6b7280",
                }}
              >
                {filePreview ? (
                  <img src={filePreview} alt="preview" style={{ height: 36, borderRadius: 8, objectFit: "cover" }} />
                ) : (
                  <Upload size={16} />
                )}
                <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13 }}>{filePreview ? "Изменить" : "Загрузить с устройства"}</span>
              </button>
              <span style={{ display: "flex", alignItems: "center", color: "#d1d5db" }}>или</span>
              <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/img.jpg" style={{ ...s.field, flex: 1 }} />
            </div>
            {filePreview && (
              <button
                type="button"
                onClick={() => { setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 12, marginTop: 4, padding: 0 }}
              >
                Удалить
              </button>
            )}
          </Field>

          <button onClick={handleSubmit} disabled={!activity || !time || !location || !needed || !deadline} style={{ marginTop: 8, width: "100%", padding: "14px", borderRadius: 8, background: !activity || !time || !location || !needed || !deadline ? "#e5e7eb" : ACCENT, border: "none", color: !activity || !time || !location || !needed || !deadline ? "#9ca3af" : "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: 16, cursor: !activity || !time || !location || !needed || !deadline ? "not-allowed" : "pointer" }}>Создать сбор</button>
        </div>
      </div>
    </div>
  );
}
