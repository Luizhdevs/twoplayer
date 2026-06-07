"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService, CreateAppointmentInput } from "@/services/appointments.service";

export const APPT_KEY = ["appointments"] as const;

export function useAppointmentsByUser(userId: string) {
  return useQuery({
    queryKey: [...APPT_KEY, "user", userId],
    queryFn:  () => appointmentsService.getByUser(userId),
    enabled:  !!userId,
  });
}

export function useAppointmentsByProvider(providerId: string) {
  return useQuery({
    queryKey: [...APPT_KEY, "provider", providerId],
    queryFn:  () => appointmentsService.getByProvider(providerId),
    enabled:  !!providerId,
  });
}

export function useAppointment(id: string, enabled = true) {
  return useQuery({
    queryKey: [...APPT_KEY, id],
    queryFn:  () => appointmentsService.getById(id),
    enabled:  !!id && enabled,
    retry:    false,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPT_KEY }),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPT_KEY }),
  });
}

// ── Hooks do ciclo de vida (Escrow) ───────────────────────────────────────────

export function useConfirmAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.confirm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPT_KEY }),
  });
}

export function useStartAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPT_KEY }),
  });
}

export function useFinishAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.finish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPT_KEY }),
  });
}

export function useApproveAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPT_KEY }),
  });
}

export function useAppointmentEvents(id: string) {
  return useQuery({
    queryKey: [...APPT_KEY, id, "events"],
    queryFn:  () => appointmentsService.getEvents(id),
    enabled:  !!id,
  });
}
