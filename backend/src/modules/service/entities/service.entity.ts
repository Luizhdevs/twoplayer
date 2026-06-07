export class ServiceEntity {
  id: string;
  providerId: string;
  title: string;
  description: string | null;
  price: number;
  duration: number;
  categories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
