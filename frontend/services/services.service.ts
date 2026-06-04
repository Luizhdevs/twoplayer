import { api } from "@/lib/api";

export type Service = {
  id:          string;
  title:       string;
  description: string;
  price:       number;
  duration:    number;
  providerId:  string;
  isActive:    boolean;
};

export type CreateServiceInput = {
  providerId:  string;
  title:       string;
  description?: string;
  price:       number;
  duration:    number;
};

export type UpdateServiceInput = Partial<Omit<CreateServiceInput, "providerId">>;

export const servicesService = {
  getByProvider: async (providerId: string): Promise<Service[]> => {
    const { data } = await api.get<{ data: Service[] }>(`/services/provider/${providerId}`);
    return data.data;
  },

  create: async (input: CreateServiceInput): Promise<Service> => {
    const { data } = await api.post<{ data: Service }>("/services", {
      ...input,
      price: Math.round(input.price * 100), // backend espera centavos
    });
    return data.data;
  },

  update: async (id: string, input: UpdateServiceInput): Promise<Service> => {
    const payload: Record<string, unknown> = { ...input };
    if (input.price !== undefined) payload.price = Math.round(input.price * 100);
    const { data } = await api.patch<{ data: Service }>(`/services/${id}`, payload);
    return data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};
