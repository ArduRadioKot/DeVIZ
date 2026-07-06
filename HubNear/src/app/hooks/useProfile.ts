import { useCallback, useState } from "react";
import * as meApi from "../api/me";
import type { Place, Screen, UserProfile } from "../types";
import type { MeProfile as ApiProfile } from "../api/types";

function apiProfileToUserProfile(p: ApiProfile): UserProfile {
  const username = p.email.split("@")[0] || "user";
  return {
    name: p.name,
    username,
    avatar: p.avatar_url || "https://i.pravatar.cc/150?img=5",
  };
}

export function useProfile(isApiAvailable: boolean) {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Загрузка...",
    username: "user",
    avatar: "https://i.pravatar.cc/150?img=5",
  });
  const [myPlaces, setMyPlaces] = useState<Place[]>([]);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await meApi.getProfile();
      setUserProfile(apiProfileToUserProfile(profile));
    } catch {}
  }, []);

  const handleUpdateProfile = useCallback(
    async (p: UserProfile) => {
      if (isApiAvailable) {
        try {
          const updated = await meApi.updateProfile({
            name: p.name,
            avatar_url: p.avatar,
          });
          setUserProfile(apiProfileToUserProfile(updated));
          return;
        } catch {}
      }
      setUserProfile(p);
    },
    [isApiAvailable],
  );

  const handleAddPlace = useCallback((place: Place) => {
    setMyPlaces((prev) => [...prev, place]);
  }, []);

  const handleRemovePlace = useCallback((id: string) => {
    setMyPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    userProfile,
    setUserProfile,
    myPlaces,
    setMyPlaces,
    loadProfile,
    handleUpdateProfile,
    handleAddPlace,
    handleRemovePlace,
  };
}
