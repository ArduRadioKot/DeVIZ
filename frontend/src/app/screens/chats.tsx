import { Send, ArrowLeft, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT, ACCENT_LIGHT } from "../theme";
import type { ChatItem, ChatParticipant, Message, Screen } from "../types";

export function ChatsScreen({
  chats,
  messages,
  onSendMessage,
  onNavigate,
  participants,
  onViewParticipants,
  initialActiveChatId,
}: {
  chats: ChatItem[];
  messages: Message[];
  onSendMessage: (chatId: string, text: string) => void;
  onNavigate: (s: Screen) => void;
  participants?: ChatParticipant[];
  onViewParticipants?: (chatId: string) => void;
  initialActiveChatId?: string;
}) {
  const isMobile = useIsMobile();
  const [activeChatId, setActiveChatId] = useState(initialActiveChatId || (chats[0]?.id ?? ""));
  const [draft, setDraft] = useState("");

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0];
  const activeMessages = useMemo(
    () => messages.filter((m) => m.chatId === activeChat?.id),
    [messages, activeChat?.id],
  );

  const showDialog = !isMobile || Boolean(activeChatId);
  const showList = !isMobile || !activeChatId;

  const handleSend = () => {
    if (!draft.trim() || !activeChat) return;
    onSendMessage(activeChat.id, draft.trim());
    setDraft("");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${ACCENT} 0%, ${ACCENT_LIGHT} 100%)`,
          padding: isMobile ? "44px 20px 12px" : "20px 24px 12px",
          borderBottomLeftRadius: isMobile ? 20 : 0,
          borderBottomRightRadius: 0,
        }}
      >
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 200, fontSize: isMobile ? 22 : 28, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Чаты</h1>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "#f8fafc" }}>
        {showList && (
          <aside
            style={{
              width: isMobile ? "100%" : 360,
              flexShrink: 0,
              overflowY: "auto",
              borderRight: isMobile ? "none" : "1px solid #e5e7eb",
              background: "#fff",
              padding: isMobile ? 0 : 12,
            }}
          >
            {chats.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", fontFamily: "Montserrat, sans-serif", fontSize: 14, color: "#9ca3af" }}>
                Нет чатов. Присоединитесь к сбору, чтобы появился чат.
              </div>
            )}
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  onClick={() => { setActiveChatId(chat.id); if (isMobile) setActiveChatId(chat.id); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    padding: isMobile ? "12px 16px" : "12px 14px",
                    gap: 12,
                    border: "none",
                    borderRadius: isMobile ? 0 : 8,
                    marginBottom: isMobile ? 0 : 8,
                    background: isActive ? "#eef7f5" : isMobile ? "#fff" : "#f8fafc",
                    borderBottom: isMobile ? "1px solid #f3f4f6" : "none",
                    cursor: "pointer",
                  }}
                >
                  <img src={chat.avatar} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }} alt={chat.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 15, margin: 0, color: "#111827" }}>{chat.name}</p>
                    <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 13, color: "#6b7280", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.last}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#9ca3af" }}>{chat.time}</span>
                    {chat.unread > 0 && (
                      <div style={{ minWidth: 20, height: 20, borderRadius: 6, padding: "0 6px", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#fff", fontWeight: 700 }}>{chat.unread}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </aside>
        )}

        {showDialog && activeChat && (
          <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
              {isMobile && (
                <button onClick={() => setActiveChatId("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                  <ArrowLeft size={20} color="#374151" />
                </button>
              )}
              <img src={activeChat.avatar} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} alt={activeChat.name} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 15, margin: 0, color: "#111827" }}>{activeChat.name}</p>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, margin: 0, color: "#9ca3af" }}>{activeChat.group ? "Групповой чат" : "В сети"}</p>
              </div>
              {activeChat.group && onViewParticipants && (
                <button
                  onClick={() => onViewParticipants(activeChat.id)}
                  style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#374151", fontFamily: "Montserrat, sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  <Users size={15} /> Участники
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px" : "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {activeMessages.map((message) => (
                <div key={message.id} style={{ display: "flex", justifyContent: message.fromMe ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: message.fromMe ? ACCENT : "#fff",
                      color: message.fromMe ? "#fff" : "#111827",
                      boxShadow: message.fromMe ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
                    }}
                  >
                    <p style={{ margin: 0, fontFamily: "Montserrat, sans-serif", fontSize: 14 }}>{message.text}</p>
                    <p style={{ margin: "4px 0 0", fontFamily: "Montserrat, sans-serif", fontSize: 11, opacity: 0.75, textAlign: "right" }}>{message.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 12, borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: 8 }}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Написать сообщение..."
                style={{
                  flex: 1,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "10px 12px",
                  outline: "none",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: 16,
                }}
              />
              <button
                onClick={handleSend}
                style={{ width: 40, borderRadius: 6, border: "none", background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Send size={16} />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
