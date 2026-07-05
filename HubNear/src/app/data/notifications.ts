import type { NotificationItem } from "../types";

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Кворум собран!",
    body: "Волейбол на Красном камне подтверждён — собираемся в 18:00",
    time: "2 часа назад",
    read: false,
    type: "quorum",
  },
  {
    id: "notif-2",
    title: "Дедлайн приближается",
    body: "До сбора «Футбол в парке» осталось меньше часа, нужно ещё 3 человека",
    time: "1 час назад",
    read: false,
    type: "deadline",
  },
  {
    id: "notif-3",
    title: "Новый участник",
    body: "Дима присоединился к «Волейбол на Красном камне»",
    time: "30 минут назад",
    read: true,
    type: "join",
  },
];

export function createQuorumNotification(eventName: string): NotificationItem {
  return {
    id: `notif-${Date.now()}`,
    title: "Кворум собран!",
    body: `${eventName} подтверждён — собираемся вовремя`,
    time: "только что",
    read: false,
    type: "quorum",
  };
}

export function createDeadlineNotification(eventName: string, needed: number): NotificationItem {
  return {
    id: `notif-${Date.now() + 1}`,
    title: "Дедлайн приближается",
    body: `До сбора «${eventName}» осталось меньше часа, нужно ещё ${needed} ${needed === 1 ? "человек" : "человека"}`,
    time: "только что",
    read: false,
    type: "deadline",
  };
}
