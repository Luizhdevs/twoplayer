export class ServiceEntity {
  id: string;
  providerId: string;
  title: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
