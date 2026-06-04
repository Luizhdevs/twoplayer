"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsService } from "@/services/reviews.service";

export const REVIEWS_KEY = ["reviews"] as const;

export function useReviewsByProvider(providerId: string) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, "provider", providerId],
    queryFn:  () => reviewsService.getByProvider(providerId),
    enabled:  !!providerId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { appointmentId: string; rating: number; comment?: string }) =>
      reviewsService.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}
