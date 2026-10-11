import { useCallback, useState } from "react";
import * as activitiesApi from "../api/activities";
import type { Event } from "../types";
import type { ActivityListItem as ApiActivity } from "../api/types";

function apiActivityToEvent(a: ApiActivity): Event {
  const deadline = new Date(a.join_deadline);
  const start = new Date(a.starts_at);
  return {
    id: a.id,
    activity: a.title,
    category: a.category,
    time:
      start.toLocaleDateString("ru-RU", { month: "long", day: "numeric" }) +
      " " +
      start.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    location: a.address,
    needed: a.participants.limit,
    current: a.participants.count,
    level:
      a.level === "any"
        ? "Любой"
        : a.level === "beginner"
          ? "Новичок"
          : a.level === "amateur"
            ? "Любитель"
            : a.level === "confident"
              ? "Уверенный"
              : a.level,
    deadline: deadline.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    deadlineTime: deadline.getTime(),
    organizer: a.organizer.name,
    avatar: a.organizer.avatar_url || "https://i.pravatar.cc/150?img=5",
    confirmed: a.status === "confirmed" || a.status === "full",
    image: undefined,
    distance:
      a.distance_m !== null && a.distance_m !== undefined
        ? a.distance_m / 1000
        : undefined,
  };
}

export function useEvents(isApiAvailable: boolean) {
  const [events, setEvents] = useState<Event[]>([]);
  const [joinedEventIds, setJoinedEventIds] = useState<Set<string>>(new Set());

  const loadEvents = useCallback(async () => {
    try {
      const page = await activitiesApi.listActivities({ limit: 50 });
      setEvents(page.items.map(apiActivityToEvent));
      const joined = new Set<string>();
      for (const item of page.items) {
        if (item.viewer.is_participant) joined.add(item.id);
      }
      setJoinedEventIds(joined);
    } catch {}
  }, []);

  const handleCreateEvent = useCallback(
    async (newEvent: Event) => {
      if (isApiAvailable) {
        try {
          const created = await activitiesApi.createActivity({
            city_id: "00000000-0000-0000-0000-000000000001",
            title: newEvent.activity,
            category: newEvent.category,
            level:
              newEvent.level === "Любой"
                ? "any"
                : newEvent.level === "Новичок"
                  ? "beginner"
                  : newEvent.level === "Любитель"
                    ? "amateur"
                    : newEvent.level === "Уверенный"
                      ? "confident"
                      : "any",
            address: newEvent.location,
            location: { latitude: 55.7558, longitude: 37.6173 },
            timezone: "Europe/Moscow",
            starts_at: new Date(Date.now() + 3600000).toISOString(),
            duration_minutes: 120,
            join_deadline: new Date(Date.now() + 1800000).toISOString(),
            participants_min: 1,
            participants_limit: newEvent.needed,
            price: null,
          });
          setEvents((prev) => [apiActivityToEvent(created), ...prev]);
          setJoinedEventIds((prev) => new Set(prev).add(created.id));
          return;
        } catch {}
      }
      setEvents((prev) => [newEvent, ...prev]);
    },
    [isApiAvailable],
  );

  const handleJoinEvent = useCallback(
    async (event: Event) => {
      if (isApiAvailable) {
        try {
          await activitiesApi.joinActivity(event.id);
        } catch {}
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, current: e.current + 1, confirmed: e.current + 1 >= e.needed }
            : e,
        ),
      );
      setJoinedEventIds((prev) => new Set(prev).add(event.id));
    },
    [isApiAvailable],
  );

  const handleLeaveEvent = useCallback(
    async (eventId: string) => {
      if (isApiAvailable) {
        try {
          await activitiesApi.leaveActivity(eventId);
        } catch {}
      }
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, current: Math.max(0, e.current - 1) } : e,
        ),
      );
      setJoinedEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    },
    [isApiAvailable],
  );

  return {
    events,
    setEvents,
    joinedEventIds,
    loadEvents,
    handleCreateEvent,
    handleJoinEvent,
    handleLeaveEvent,
  };
}
