import { api } from "@/lib/api";

export type WalletTransaction = {
  id:          string;
  type:        "credit" | "debit" | "withdrawal" | "refund";
  amount:      number;
  description: string | null;
  status:      string;
  createdAt:   string;
};

export type Wallet = {
  id:           string;
  balance:      number;
  totalCredit:  number;
  totalDebit:   number;
  transactions: WalletTransaction[];
};

export const walletService = {
  getWallet: async (ownerId: string): Promise<Wallet> => {
    const { data } = await api.get<{ data: Wallet }>(`/wallet/${ownerId}`);
    return data.data;
  },

  addBalance: async (
    ownerId: string,
    body: { amount: number; description?: string },
  ): Promise<{ message: string; amount: number }> => {
    const { data } = await api.post(`/wallet/${ownerId}/add`, body);
    return data;
  },

  withdraw: async (
    ownerId: string,
    body: { amount: number; pixKey: string },
  ) => {
    const { data } = await api.post(`/wallet/${ownerId}/withdraw`, body);
    return data;
  },
};
