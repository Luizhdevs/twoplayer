"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";

export const WALLET_KEY = (ownerId: string) => ["wallet", ownerId] as const;

export function useWallet(ownerId: string) {
  return useQuery({
    queryKey: WALLET_KEY(ownerId),
    queryFn:  () => walletService.getWallet(ownerId),
    enabled:  !!ownerId,
  });
}

export function useAddBalance(ownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; description?: string }) =>
      walletService.addBalance(ownerId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: WALLET_KEY(ownerId) }),
  });
}

export function useWithdraw(ownerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; pixKey: string }) =>
      walletService.withdraw(ownerId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: WALLET_KEY(ownerId) }),
  });
}
