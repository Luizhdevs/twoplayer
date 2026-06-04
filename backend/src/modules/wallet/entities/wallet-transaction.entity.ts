import { TransactionStatus, TransactionType } from '@prisma/client';

export class WalletTransactionEntity {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  referenceId: string | null;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}
