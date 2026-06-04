"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";

export const NOTIF_KEY = (userId: string) => ["notifications", userId] as const;

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: NOTIF_KEY(userId),
    queryFn:  () => notificationsService.getAll(userId),
    enabled:  !!userId,
    refetchInterval: 30_000, // polling a cada 30s
  });
}

export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: [...NOTIF_KEY(userId), "unread"],
    queryFn:  () => notificationsService.getUnreadCount(userId),
    enabled:  !!userId,
    refetchInterval: 15_000,
  });
}

export function useMarkAsRead(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY(userId) }),
  });
}

export function useMarkAllAsRead(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY(userId) }),
  });
}
