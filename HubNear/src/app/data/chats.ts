import type { ChatItem, Event, Message } from "../types";

export const INITIAL_CHATS: ChatItem[] = [
  {
    id: "devs",
    name: "Разработчики",
    avatar: "https://i.pravatar.cc/150?img=68",
    last: "Привет! Добро пожаловать!",
    time: "12:10",
    unread: 1,
    group: true,
  },
  {
    id: "rita",
    name: "Рита Смирнова",
    avatar: "https://i.pravatar.cc/150?img=9",
    last: "Увидимся завтра?",
    time: "11:30",
    unread: 0,
    group: false,
  },
  {
    id: "dima",
    name: "Дима Козлов",
    avatar: "https://i.pravatar.cc/150?img=11",
    last: "Отличная идея!",
    time: "Вчера",
    unread: 3,
    group: false,
  },
  {
    id: "hike",
    name: "Поход в горы",
    avatar: "https://i.pravatar.cc/150?img=44",
    last: "Кто берёт палатку?",
    time: "Вчера",
    unread: 7,
    group: true,
  },
];

export const INITIAL_MESSAGES: Message[] = [
  { id: "m1", chatId: "devs", fromMe: false, text: "Привет! Добро пожаловать в чат", time: "12:01" },
  { id: "m2", chatId: "devs", fromMe: true, text: "Спасибо! Когда ближайший сбор?", time: "12:03" },
  { id: "m3", chatId: "devs", fromMe: false, text: "Сегодня в 19:00 волейбол, парк Горького", time: "12:04" },
  { id: "m4", chatId: "rita", fromMe: false, text: "Увидимся завтра?", time: "11:30" },
  { id: "m5", chatId: "dima", fromMe: false, text: "Отличная идея!", time: "Вчера" },
  { id: "m6", chatId: "hike", fromMe: false, text: "Кто берёт палатку?", time: "Вчера" },
];

export function createEventChat(event: Event): ChatItem {
  return {
    id: `event-${event.id}`,
    name: event.activity,
    avatar: event.avatar,
    last: `Чат мероприятия «${event.activity}»`,
    time: "только что",
    unread: 0,
    group: true,
    eventId: event.id,
  };
}

export function createEventWelcomeMessage(event: Event): Message {
  return {
    id: `evt-msg-${event.id}-${Date.now()}`,
    chatId: `event-${event.id}`,
    fromMe: false,
    text: `Добро пожаловать в чат сбора «${event.activity}»! Место встречи: ${event.location}, время: ${event.time}.`,
    time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  };
}
