import { useMemo, useState } from "react";
import { Activity, Bell, Camera, ChevronRight, Edit3, Lock, LogOut, MapPin, Plus, Settings, Trophy, X, type LucideIcon } from "lucide-react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_LIGHT, ACCENT_MUTED } from "../theme";
import type { Event, Place, Screen, UserProfile } from "../types";

const FRIENDS = [
  { name: "Дима", avatar: "https://i.pravatar.cc/150?img=11", event: "Футбол в парке", time: "сегодня" },
  { name: "Рита", avatar: "https://i.pravatar.cc/150?img=9", event: "Волейбол", time: "вчера" },
  { name: "Катя", avatar: "https://i.pravatar.cc/150?img=22", event: "Теннис", time: "2 дня назад" },
  { name: "Иван", avatar: "https://i.pravatar.cc/150?img=30", event: "Бег", time: "на неделе" },
];

const analyticsItems: { label: string; val: string; sub: string; color: string; bg: string; Icon: LucideIcon }[] = [
  { label: "Проведённые сборы", val: "12", sub: "за всё время", color: ACCENT, bg: ACCENT_MUTED, Icon: Activity },
  { label: "Собрано участников", val: "84", sub: "в сумме", color: ACCENT_LIGHT, bg: "#e6f7f4", Icon: MapPin },
  { label: "Любимая активность", val: "Волейбол", sub: "7 сборов", color: "#6366f1", bg: "#eef2ff", Icon: Trophy },
];

export function ProfileScreen({
  onNavigate,
  myPlaces,
  onAddPlace,
  onRemovePlace,
  profile,
  events,
  joinedEventIds,
  onViewFriendProfile,
  friendsCount,
  onNavigateToFriends,
}: {
  onNavigate: (s: Screen) => void;
  myPlaces: Place[];
  onAddPlace: (p: Place) => void;
  onRemovePlace: (id: string) => void;
  profile: UserProfile;
  events?: Event[];
  joinedEventIds?: Set<string>;
  onViewFriendProfile?: (friend: { name: string; avatar: string }) => void;
  friendsCount?: number;
  onNavigateToFriends?: () => void;
}) {
  const isMobile = useIsMobile();

  const visitedEvents = useMemo(
    () => (events ?? []).filter((e) => joinedEventIds?.has(e.id)),
    [events, joinedEventIds],
  );
  const displayedVisited = visitedEvents.slice(0, 5);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceImg, setNewPlaceImg] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  const handleAdd = () => {
    const name = newPlaceName.trim();
    if (!name || !newPlaceImg) return;
    onAddPlace({
      id: `place-${Date.now()}`,
      name,
      img: newPlaceImg,
    });
    setNewPlaceName("");
    setNewPlaceImg("");
    setShowAddPlace(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setNewPlaceImg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(160deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`, padding: isMobile ? "44px 20px 20px" : "60px 32px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative" }}>
        <div style={{ position: "absolute", top: isMobile ? 46 : 60, right: isMobile ? 20 : 32, display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate("notifications")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell size={16} color="rgba(255,255,255,0.85)" />
          </button>
          <button onClick={() => onNavigate("settings")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Settings size={isMobile ? 22 : 24} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        <div style={{ position: "relative", marginTop: 8 }}>
          <img src={profile.avatar} style={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100, borderRadius: "50%", border: "3px solid #fff", objectFit: "cover" }} alt="profile" />
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: "50%", background: ACCENT, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={11} color="#fff" />
          </div>
        </div>

        <h2 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 20 : 24, color: "#fff", margin: 0 }}>{profile.name}</h2>
        <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.75)", margin: 0 }}>@{profile.username}</p>

        <div style={{ display: "flex", gap: isMobile ? 24 : 32, marginTop: 8 }}>
          {[{ label: "Сборы", val: "12", onClick: undefined }, { label: "Друзья", val: friendsCount?.toString() ?? "124", onClick: onNavigateToFriends }, { label: "Участников", val: "84", onClick: undefined }].map((s) => (
            s.onClick ? (
              <button key={s.label} onClick={s.onClick} style={{ textAlign: "center", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 18 : 20, color: "#fff", margin: 0 }}>{s.val}</p>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>{s.label}</p>
              </button>
            ) : (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 18 : 20, color: "#fff", margin: 0 }}>{s.val}</p>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>{s.label}</p>
              </div>
            )
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb", padding: isMobile ? 0 : "24px 32px" }}>
        <Section title="Аналитика" isMobile={isMobile}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
             {analyticsItems.map(({ label, val, sub, color, bg, Icon }) => (
              <div key={label} style={{ background: bg, borderRadius: 8, padding: isMobile ? "14px 16px" : "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: isMobile ? 46 : 52, height: isMobile ? 46 : 52, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={isMobile ? 22 : 24} color="#fff" /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 12 : 13, color: "#6b7280", margin: 0 }}>{label}</p>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: isMobile ? 20 : 22, margin: "1px 0 0", color: "#111827" }}>{val}</p>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "#9ca3af", margin: "1px 0 0" }}>{sub}</p>
                </div>
                <ChevronRight size={16} color="#9ca3af" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Друзья" isMobile={isMobile}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FRIENDS.map((f) => (
              <div
                key={f.name}
                onClick={() => onViewFriendProfile?.(f)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", cursor: "pointer", padding: 0 }}
              >
                <img src={f.avatar} style={{ width: isMobile ? 44 : 48, height: isMobile ? 44 : 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${ACCENT}`, flexShrink: 0 }} alt={f.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: isMobile ? 13 : 14, color: "#111827" }}>{f.name}</span>
                  <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "#6b7280", margin: "1px 0 0" }}>идёт на «{f.event}» &middot; {f.time}</p>
                </div>
                <span style={{ background: ACCENT_MUTED, borderRadius: 8, padding: "6px 12px", fontFamily: "Montserrat, sans-serif", fontSize: 12, color: ACCENT, fontWeight: 600, whiteSpace: "nowrap" }}>
                  Позвать
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Мои места"
          isMobile={isMobile}
          action={!showAddPlace ? { label: "Добавить", onClick: () => setShowAddPlace(true) } : undefined}
        >
          {showAddPlace && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              <input
                value={newPlaceName}
                onChange={(e) => setNewPlaceName(e.target.value)}
                placeholder="Название места"
                style={{ width: "100%", background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 12px", fontFamily: "Montserrat, sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newPlaceImg}
                  onChange={(e) => setNewPlaceImg(e.target.value)}
                  placeholder="Ссылка на фото"
                  style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 12px", fontFamily: "Montserrat, sans-serif", fontSize: 13, outline: "none" }}
                />
                <label style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#374151", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                  <Camera size={14} /> Файл
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
              {newPlaceImg && (
                <img src={newPlaceImg} style={{ width: "100%", height: 120, borderRadius: 8, objectFit: "cover" }} alt="preview" />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAdd}
                  disabled={!newPlaceName.trim() || !newPlaceImg}
                  style={{ flex: 1, background: newPlaceName.trim() && newPlaceImg ? ACCENT : "#d1d5db", border: "none", borderRadius: 8, padding: "10px 14px", color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, cursor: newPlaceName.trim() && newPlaceImg ? "pointer" : "not-allowed" }}
                >Добавить</button>
                <button onClick={() => { setShowAddPlace(false); setNewPlaceName(""); setNewPlaceImg(""); }} style={{ background: "none", border: "none", padding: "10px 8px", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>Отмена</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: isMobile ? 10 : 16, overflowX: "auto", paddingBottom: 4 }}>
            {myPlaces.length === 0 && (
              <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#9ca3af", margin: 0 }}>Нет мест — добавьте любимые локации для сборов</p>
            )}
            {myPlaces.map((p) => (
              <div key={p.id} style={{ flexShrink: 0, width: isMobile ? 120 : 140, position: "relative" }}>
                <button
                  onClick={() => onRemovePlace(p.id)}
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}
                >
                  <X size={11} color="#fff" />
                </button>
                <img src={p.img} style={{ width: isMobile ? 120 : 140, height: isMobile ? 85 : 100, borderRadius: 8, objectFit: "cover", display: "block" }} alt={p.name} />
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 11 : 12, color: "#374151", margin: "4px 0 0", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {visitedEvents.length > 0 && (
          <Section
            title="Посещённые сборы"
            isMobile={isMobile}
            action={visitedEvents.length > 0 ? { label: "Все", onClick: () => onNavigate("visited"), icon: ChevronRight } : undefined}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {displayedVisited.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  {e.image && (
                    <img src={e.image} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 13, color: "#111827", margin: 0 }}>{e.activity}</p>
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{e.location} &middot; {e.time}</p>
                  </div>
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: ACCENT, fontWeight: 600 }}>Участвовал</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div style={{ background: "#fff", margin: isMobile ? "8px 0" : "0 0 16px 0", overflow: "hidden", borderRadius: isMobile ? 0 : 12 }}>
          <ActionRow icon={Edit3} label="Редактировать профиль" desc="Имя, username, аватар" onClick={() => onNavigate("edit-profile")} />
          <ActionRow icon={Lock} label="Сменить пароль" desc="Обновить пароль для входа" onClick={() => onNavigate("change-password")} />
          <ActionRow icon={LogOut} label="Выйти" desc="Выйти из аккаунта" onClick={() => setShowLogout(true)} />
        </div>
      </div>

      {showLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: "24px 20px 20px", maxWidth: 320, width: "100%", textAlign: "center" }}>
            <LogOut size={28} color="#ef4444" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 16, color: "#111827", margin: "0 0 4px" }}>Выйти из аккаунта?</p>
            <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>Вы всегда сможете войти снова</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 8, padding: "12px", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#374151", cursor: "pointer" }}>Отмена</button>
              <button onClick={() => { setShowLogout(false); onNavigate("welcome"); }} style={{ flex: 1, background: "#ef4444", border: "none", borderRadius: 8, padding: "12px", fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", cursor: "pointer" }}>Выйти</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRow({ icon: Icon, label, desc, onClick }: { icon: LucideIcon; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        border: "none",
        background: "#fff",
        borderBottom: "1px solid #f3f4f6",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 8, background: ACCENT_MUTED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={ACCENT} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>{label}</p>
        <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{desc}</p>
      </div>
      <ChevronRight size={15} color="#9ca3af" />
    </button>
  );
}

function Section({ title, isMobile, children, action }: { title: string; isMobile: boolean; children: React.ReactNode; action?: { label: string; onClick: () => void; icon?: LucideIcon } }) {
  const ActionIcon = action?.icon || Plus;
  return (
    <div style={{ background: "#fff", margin: isMobile ? "8px 0" : "0 0 16px 0", padding: isMobile ? "14px 16px" : "20px 24px", borderRadius: isMobile ? 0 : 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 12 : 16 }}>
        <h3 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: isMobile ? 15 : 17, margin: 0 }}>{title}</h3>
        {action ? (
          <button onClick={action.onClick} style={{ background: "none", border: "none", color: ACCENT, fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 13 : 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
            <ActionIcon size={14} /> {action.label}
          </button>
        ) : (
          <button style={{ background: "none", border: "none", color: ACCENT, fontFamily: "Montserrat, sans-serif", fontSize: isMobile ? 13 : 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
            Все <ChevronRight size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
