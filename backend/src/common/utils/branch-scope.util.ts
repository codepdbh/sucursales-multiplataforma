import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export function resolveOperationalBranchId(
  user: AuthenticatedUser,
  requestedBranchId?: string,
): string {
  if (user.role === UserRole.REGISTRADOR) {
    if (!user.branchId) {
      throw new ForbiddenException(
        'El registrador no tiene una sucursal asignada en el sistema.',
      );
    }

    return user.branchId;
  }

  if (!requestedBranchId) {
    throw new BadRequestException(
      'Debe indicar la sucursal para esta operación.',
    );
  }

  return requestedBranchId;
}

export function ensureBranchScope(
  user: AuthenticatedUser,
  branchId: string,
): void {
  if (user.role === UserRole.REGISTRADOR && user.branchId !== branchId) {
    throw new ForbiddenException(
      'No tiene permisos para acceder a información de otra sucursal.',
    );
  }
}
