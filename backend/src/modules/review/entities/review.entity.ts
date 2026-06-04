export class ReviewEntity {
  id: string;
  appointmentId: string;
  userId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
