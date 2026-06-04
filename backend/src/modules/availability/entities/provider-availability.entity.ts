export class ProviderAvailabilityEntity {
  id: string;
  providerId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
