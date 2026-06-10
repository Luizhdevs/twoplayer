"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersService } from "@/services/providers.service";
import { api } from "@/lib/api";
import type { HomeData, ProviderCard } from "@/services/providers.service";

export const PROVIDERS_KEY = ["providers"] as const;

export function useHomeProviders() {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, "home"],
    queryFn:  providersService.getHome,
    staleTime: 30 * 1000,
  });
}

export function useMyProviderProfile(name: string) {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, "my-profile", name],
    queryFn: async (): Promise<ProviderCard | null> => {
      const { data } = await api.get<{ data: HomeData }>("/providers");
      const { topProviders, categories } = data.data;
      const all = [
        ...topProviders,
        ...categories.flatMap(c => c.providers),
      ];
      const unique = [...new Map(all.map(p => [p.id, p])).values()];
      return unique.find(p => p.name === name) ?? null;
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyProviderDirect() {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, "me", "direct"],
    queryFn: async (): Promise<{ id: string } | null> => {
      // /providers/me returns { data: { data: { id, ... } } } (double-wrapped)
      const { data } = await api.get("/providers/me");
      const raw = data?.data;
      return raw?.data ?? raw ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProvider(id: string) {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, id],
    queryFn:  () => providersService.getById(id),
    enabled:  !!id,
  });
}

export function useAvailableSlots(
  providerId: string,
  date: string,
  serviceDuration?: number,
) {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, providerId, "slots", date, serviceDuration],
    queryFn:  () => providersService.getAvailableSlots(providerId, date, serviceDuration),
    enabled:  !!providerId && !!date,
    staleTime: 30 * 1000,
  });
}

export function useMyAvailability() {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, "me", "availability"],
    queryFn:  providersService.getAvailability,
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: providersService.setAvailability,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...PROVIDERS_KEY, "me", "availability"] }),
  });
}

export function useMyBlocks() {
  return useQuery({
    queryKey: [...PROVIDERS_KEY, "me", "blocks"],
    queryFn:  providersService.getBlocks,
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: providersService.createBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...PROVIDERS_KEY, "me", "blocks"] }),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providersService.deleteBlock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...PROVIDERS_KEY, "me", "blocks"] }),
  });
}

export function useAddGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => providersService.addGalleryImage(file),
    onSuccess: (_r, _v, ctx) =>
      qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useRemoveGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => providersService.removeGalleryImage(imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}
