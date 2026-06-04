import { EscrowStatus } from '@prisma/client';

export class EscrowTransactionEntity {
  id: string;
  appointmentId: string;
  paymentId: string;
  providerId: string;
  amount: number;
  status: EscrowStatus;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
