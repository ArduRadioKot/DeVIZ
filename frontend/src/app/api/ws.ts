import { getStoredToken } from "./client";

type MessageHandler = (msg: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribedChats = new Set<string>();
  private url = "";

  connect() {
    const token = getStoredToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.url = `${protocol}//${host}/api/v1/ws?token=${token}`;

    this._connect();
  }

  private _connect() {
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      for (const chatId of this.subscribedChats) {
        this.ws?.send(JSON.stringify({ type: "subscribe", chat_id: chatId }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.subscribers.get(data.type);
        if (handlers) {
          for (const h of handlers) h(data);
        }
        const chatHandlers = this.subscribers.get(`chat:${data.message?.chat_id}`);
        if (chatHandlers && data.type === "new_message") {
          for (const h of chatHandlers) h(data.message);
        }
      } catch {}
    };

    this.ws.onclose = () => {
      this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.subscribedChats.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(chatId: string) {
    this.subscribedChats.add(chatId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "subscribe", chat_id: chatId }));
    }
  }

  unsubscribe(chatId: string) {
    this.subscribedChats.delete(chatId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "unsubscribe", chat_id: chatId }));
    }
  }

  sendMessage(chatId: string, text: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "message", chat_id: chatId, text }));
      return true;
    }
    return false;
  }

  on(type: string, handler: MessageHandler) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler);
    return () => this.subscribers.get(type)?.delete(handler);
  }
}

export const wsManager = new WebSocketManager();
