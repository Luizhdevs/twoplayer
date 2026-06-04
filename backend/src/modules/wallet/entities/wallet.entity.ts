export class WalletEntity {
  id: string;
  ownerId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
