"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "@/services/payments.service";

export const PAYMENT_KEY = ["payments"] as const;

export function usePaymentByAppointment(appointmentId: string) {
  return useQuery({
    queryKey: [...PAYMENT_KEY, "appointment", appointmentId],
    queryFn:  () => paymentsService.getByAppointment(appointmentId),
    enabled:  !!appointmentId,
    retry:    false, // Não tentar novamente se não encontrado
  });
}

export function useCreateCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      paymentsService.createCheckout(appointmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PAYMENT_KEY }),
  });
}

export function useSimulateSuccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      paymentsService.simulateSuccess(appointmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEY });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
