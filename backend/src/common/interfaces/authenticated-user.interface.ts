import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  sub: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}
