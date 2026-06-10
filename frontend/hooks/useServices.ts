"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesService, type CreateServiceInput, type UpdateServiceInput } from "@/services/services.service";
import { PROVIDERS_KEY } from "@/hooks/useProviders";

export const SERVICES_KEY = ["services"] as const;

export function useServicesByProvider(providerId: string) {
  return useQuery({
    queryKey: [...SERVICES_KEY, "provider", providerId],
    queryFn:  () => servicesService.getByProvider(providerId),
    enabled:  !!providerId,
    staleTime: 30 * 1000,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceInput) => servicesService.create(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...SERVICES_KEY, "provider", vars.providerId] });
      qc.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
  });
}

export function useUpdateService(providerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceInput }) =>
      servicesService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...SERVICES_KEY, "provider", providerId] });
      qc.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
  });
}

export function useDeleteService(providerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...SERVICES_KEY, "provider", providerId] });
      qc.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
  });
}
