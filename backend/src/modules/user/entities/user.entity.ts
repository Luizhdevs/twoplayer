import { Role } from '@prisma/client';

export class UserEntity {
  id: string;
  firebaseUid: string | null;
  email: string;
  name: string;
  cpf: string | null;
  birthDate: Date | null;
  avatarUrl: string | null;
  bio: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
