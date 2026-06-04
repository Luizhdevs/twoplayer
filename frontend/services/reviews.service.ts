import { api } from "@/lib/api";

export type Review = {
  id:            string;
  appointmentId: string;
  rating:        number;
  comment:       string | null;
  user:          { name: string };
  service:       { title: string };
  createdAt:     string;
};

export const reviewsService = {
  getByProvider: async (providerId: string): Promise<Review[]> => {
    const { data } = await api.get<{ data: Review[] }>(`/reviews/provider/${providerId}`);
    return data.data;
  },

  create: async (body: {
    appointmentId: string;
    rating:        number;
    comment?:      string;
  }): Promise<Review> => {
    const { data } = await api.post<{ data: Review }>("/reviews", body);
    return data.data;
  },
};
