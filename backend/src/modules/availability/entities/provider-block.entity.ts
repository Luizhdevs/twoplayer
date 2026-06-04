export class ProviderBlockEntity {
  id: string;
  providerId: string;
  startDatetime: Date;
  endDatetime: Date;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
