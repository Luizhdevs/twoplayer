import { api } from "@/lib/api";

export type Appointment = {
  id:          string;
  userId:      string;
  serviceId:   string;
  providerId:  string;
  scheduledAt: string;
  status:      AppointmentStatus;
  amount:      number;
  meetingUrl:  string | null;
  service:     { id: string; title: string; price: number; duration: number };
  provider:    { id: string; user: { name: string; avatarUrl: string | null } };
  user:        { id: string; name: string };
};

export type AppointmentStatus =
  | "PENDING_PAYMENT"
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "AWAITING_CLIENT_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED";

export type CreateAppointmentInput = {
  userId:      string;
  serviceId:   string;
  providerId:  string;
  scheduledAt: string;
  notes?:      string;
};

export const appointmentsService = {
  getByUser: async (userId: string): Promise<Appointment[]> => {
    const { data } = await api.get<{ data: Appointment[] }>(`/appointments/user/${userId}`);
    return data.data;
  },

  getByProvider: async (providerId: string): Promise<Appointment[]> => {
    const { data } = await api.get<{ data: Appointment[] }>(`/appointments/provider/${providerId}`);
    return data.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const { data } = await api.get<{ data: Appointment }>(`/appointments/${id}`);
    return data.data;
  },

  create: async (input: CreateAppointmentInput): Promise<Appointment> => {
    const { data } = await api.post<{ data: Appointment }>("/appointments", input);
    return data.data;
  },

  cancel: async (id: string): Promise<Appointment> => {
    const { data } = await api.patch<{ data: Appointment }>(`/appointments/${id}/cancel`);
    return data.data;
  },

  // Ciclo de vida (Escrow)
  confirm: async (id: string): Promise<Appointment> => {
    const { data } = await api.post<{ data: Appointment }>(`/appointments/${id}/confirm`);
    return data.data;
  },

  start: async (id: string): Promise<Appointment> => {
    const { data } = await api.post<{ data: Appointment }>(`/appointments/${id}/start`);
    return data.data;
  },

  finish: async (id: string): Promise<Appointment> => {
    const { data } = await api.post<{ data: Appointment }>(`/appointments/${id}/finish`);
    return data.data;
  },

  approve: async (id: string): Promise<Appointment> => {
    const { data } = await api.post<{ data: Appointment }>(`/appointments/${id}/approve`);
    return data.data;
  },

  getEvents: async (id: string) => {
    const { data } = await api.get<{ data: any[] }>(`/appointments/${id}/events`);
    return data.data;
  },
};
