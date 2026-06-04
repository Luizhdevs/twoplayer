import { api } from "@/lib/api";

export type ProviderCard = {
  id:         string;
  name:       string;
  avatarUrl:  string;
  rating:     number;
  price:      number;
  categories: string[];
};

export type HomeData = {
  topProviders: ProviderCard[];
  categories:   { name: string; providers: ProviderCard[] }[];
};

export type ProviderProfile = {
  id:           string;
  avatarUrl:    string;
  bio:          string;
  categories:   string[];
  isVerified:   boolean;
  rating:       number;
  totalReviews: number;
  user:         { name: string };
  services:     { id: string; title: string; description: string; price: number; duration: number }[];
  reviews:      { id: string; rating: number; comment: string; user: { name: string }; services: { id?: string; title: string } }[];
  images:       string[];
};

export type AvailableSlot = string; // "HH:mm"

export type AvailabilityRule = {
  id:         string;
  weekday:    number;        // 0=Domingo ... 6=Sábado
  startTime:  string;        // "HH:mm"
  endTime:    string;        // "HH:mm"
  providerId: string;
};

export type AvailabilityBlock = {
  id:             string;
  startDatetime:  string;    // ISO string
  endDatetime:    string;    // ISO string
  reason:         string | null;
  providerId:     string;
};

export const providersService = {
  getHome: async (): Promise<HomeData> => {
    const { data } = await api.get<{ data: HomeData }>("/providers");
    return data.data;
  },

  getById: async (id: string): Promise<ProviderProfile> => {
    const { data } = await api.get<{ data: ProviderProfile }>(`/providers/${id}`);
    return data.data;
  },

  getAvailableSlots: async (
    providerId: string,
    date: string,
    serviceDuration?: number,
  ): Promise<AvailableSlot[]> => {
    const { data } = await api.get<{ data: AvailableSlot[] }>(
      `/providers/${providerId}/available-slots`,
      { params: { date, ...(serviceDuration ? { serviceDuration } : {}) } },
    );
    return data.data;
  },

  getAvailability: async (): Promise<AvailabilityRule[]> => {
    const { data } = await api.get<{ data: AvailabilityRule[] }>("/providers/me/availability");
    return data.data;
  },

  setAvailability: async (schedule: { weekday: number; startTime: string; endTime: string }[]): Promise<AvailabilityRule[]> => {
    const { data } = await api.put<{ data: AvailabilityRule[] }>("/providers/me/availability", { schedule });
    return data.data;
  },

  getBlocks: async (): Promise<AvailabilityBlock[]> => {
    const { data } = await api.get<{ data: AvailabilityBlock[] }>("/providers/me/blocks");
    return data.data;
  },

  createBlock: async (block: { startDateTime: string; endDateTime: string; reason: string }): Promise<AvailabilityBlock> => {
    const { data } = await api.post<{ data: AvailabilityBlock }>("/providers/me/blocks", block);
    return data.data;
  },

  deleteBlock: async (id: string): Promise<void> => {
    await api.delete(`/providers/me/blocks/${id}`);
  },

  addGalleryImage: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ data: { id: string; url: string } }>(
      "/providers/me/gallery",
      form,
      // No manual Content-Type — axios sets multipart/form-data with boundary automatically
    );
    return data.data;
  },

  removeGalleryImage: async (imageId: string) => {
    await api.delete(`/providers/me/gallery/${imageId}`);
  },
};
