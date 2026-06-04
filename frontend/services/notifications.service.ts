import { api } from "@/lib/api";

export type Notification = {
  id:        string;
  title:     string;
  body:      string | null;
  type:      "APPOINTMENT" | "REVIEW" | "WALLET" | "SYSTEM";
  readAt:    string | null;
  createdAt: string;
};

export const notificationsService = {
  getAll: async (userId: string): Promise<Notification[]> => {
    const { data } = await api.get<{ data: Notification[] }>(`/notifications/user/${userId}`);
    return data.data;
  },

  getUnreadCount: async (userId: string): Promise<{ unread: number }> => {
    const { data } = await api.get<{ data: { unread: number } }>(
      `/notifications/user/${userId}/unread`,
    );
    return data.data;
  },

  markAsRead: async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId: string) => {
    await api.patch(`/notifications/user/${userId}/read-all`);
  },
};
