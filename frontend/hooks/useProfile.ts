"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import type { UserProfile } from "@/services/users.service";

export const PROFILE_KEY = (id: string) => ["profile", id] as const;

export function useProfile(id: string) {
  return useQuery({
    queryKey: PROFILE_KEY(id),
    queryFn:  () => usersService.getProfile(id),
    enabled:  !!id,
  });
}

export function useUpdateProfile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; bio?: string }) =>
      usersService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY(id) }),
  });
}

export function useUpdateAvatar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => usersService.updateAvatar(file),
    onSuccess: (avatarUrl) => {
      qc.setQueryData<UserProfile>(PROFILE_KEY(id), (old) =>
        old ? { ...old, avatarUrl } : old,
      );
      qc.invalidateQueries({ queryKey: PROFILE_KEY(id) });
    },
  });
}
