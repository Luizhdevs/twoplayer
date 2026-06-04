import { api } from "@/lib/api";
import { uploadFile } from "@/lib/api";

export type UserProfile = {
  id:           string;
  name:         string;
  email:        string;
  avatarUrl:    string | null;
  bio:          string | null;
  wallet:       { balance: number } | null;
  appointments: {
    id:          string;
    service:     string;
    provider:    string;
    scheduledAt: string;
    amount:      number;
    status:      string;
    meetingUrl:  string | null;
  }[];
};

export const usersService = {
  getProfile: async (id: string): Promise<UserProfile> => {
    const { data } = await api.get<{ data: UserProfile }>(`/users/${id}/profile`);
    return data.data;
  },

  update: async (id: string, body: { name?: string; bio?: string; avatarUrl?: string }) => {
    const { data } = await api.patch<{ data: UserProfile }>(`/users/${id}`, body);
    return data.data;
  },

  updateAvatar: async (file: File): Promise<{ id: string; url: string }> => {
    return uploadFile("/users/me/avatar", file);
  },

  create: async (body: { firebaseUid: string; email: string; name: string }) => {
    const { data } = await api.post<{ data: UserProfile }>("/users", body);
    return data.data;
  },
};
