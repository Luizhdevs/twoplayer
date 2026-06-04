import { api } from "@/lib/api";

export type Payment = {
  id:            string;
  appointmentId: string;
  externalId:    string | null;
  amount:        number;
  currency:      string;
  status:        "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELLED";
  paymentMethod: string | null;
  paidAt:        string | null;
  createdAt:     string;
};

export const paymentsService = {
  createCheckout: async (
    appointmentId: string,
  ): Promise<{ checkoutUrl: string; paymentId: string }> => {
    const { data } = await api.post<{ data: { checkoutUrl: string; paymentId: string } }>(
      "/payments/create-checkout",
      { appointmentId },
    );
    return data.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const { data } = await api.get<{ data: Payment }>(`/payments/${id}`);
    return data.data;
  },

  getByAppointment: async (appointmentId: string): Promise<Payment> => {
    const { data } = await api.get<{ data: Payment }>(`/payments/appointment/${appointmentId}`);
    return data.data;
  },

  simulateSuccess: async (appointmentId: string): Promise<{ ok: boolean; paymentId: string; appointmentId: string }> => {
    const { data } = await api.post<{ data: { ok: boolean; paymentId: string; appointmentId: string } }>(
      `/payments/${appointmentId}/simulate-success`,
    );
    return data.data;
  },
};
