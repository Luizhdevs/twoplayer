import { PaymentStatus } from '@prisma/client';

export class PaymentEntity {
  id: string;
  appointmentId: string;
  externalId: string | null;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
