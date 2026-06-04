export class ProviderEntity {
  id: string;
  userId: string;
  isVerified: boolean;
  categories: string[];
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
