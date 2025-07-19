import { UserRole } from 'generated/prisma';

export interface UserJWT {
  id: number;
  role: UserRole;
}
