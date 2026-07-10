import { useCallback, useMemo, useState } from "react";
import * as friendsApi from "../api/friends";
import type { ChatParticipant, Friend } from "../types";

export function useFriends(isApiAvailable: boolean) {
  const [friends, setFriends] = useState<Friend[]>([]);

  const loadFriends = useCallback(async () => {
    try {
      const list = await friendsApi.listFriends();
      setFriends(
        list.map((f) => ({
          id: f.id,
          name: f.name,
          avatar: f.avatar_url || "https://i.pravatar.cc/150?img=5",
          mutualEvents: f.mutual_events,
        })),
      );
    } catch {}
  }, []);

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  const isFriend = useCallback(
    (participant: ChatParticipant) => friendIds.has(participant.id),
    [friendIds],
  );

  const handleAddFriend = useCallback((participant: ChatParticipant) => {
    setFriends((prev) => {
      if (prev.some((f) => f.id === participant.id)) return prev;
      if (isApiAvailable) friendsApi.sendFriendRequest(participant.id).catch(() => {});
      return [...prev, { id: participant.id, name: participant.name, avatar: participant.avatar, mutualEvents: 0 }];
    });
  }, [isApiAvailable]);

  return {
    friends,
    setFriends,
    loadFriends,
    friendIds,
    isFriend,
    handleAddFriend,
  };
}
