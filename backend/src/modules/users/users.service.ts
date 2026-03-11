import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './entities/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    this.assertCanCreateRole(actor.role, dto.role);
    await this.validateBranchAssignment(dto.role, dto.branchId);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        role: dto.role,
        branchId: dto.role === UserRole.REGISTRADOR ? dto.branchId : null,
      },
      include: {
        branch: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      metadata: {
        username: user.username,
        role: user.role,
      },
    });

    return this.toResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        branch: true,
      },
    });

    return this.toResponse(user);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        branch: true,
      },
    });

    this.assertCanManageUser(actor.role, target.role);

    const nextRole = dto.role ?? target.role;
    await this.validateBranchAssignment(
      nextRole,
      dto.branchId ?? target.branchId ?? undefined,
    );

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: dto.username?.trim(),
        email: dto.email?.trim().toLowerCase(),
        passwordHash: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : undefined,
        role: dto.role,
        branchId:
          nextRole === UserRole.REGISTRADOR
            ? (dto.branchId ?? target.branchId)
            : null,
      },
      include: {
        branch: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user.id,
      metadata: {
        username: user.username,
        role: user.role,
      },
    });

    return this.toResponse(user);
  }

  async updateStatus(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        branch: true,
      },
    });

    this.assertCanManageUser(actor.role, target.role);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
      include: {
        branch: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'UPDATE_USER_STATUS',
      entity: 'User',
      entityId: user.id,
      metadata: {
        username: user.username,
        isActive: user.isActive,
      },
    });

    return this.toResponse(user);
  }

  private async validateBranchAssignment(
    role: UserRole,
    branchId?: string,
  ): Promise<void> {
    if (role === UserRole.REGISTRADOR && !branchId) {
      throw new BadRequestException(
        'Los usuarios REGISTRADOR deben tener una sucursal asignada.',
      );
    }

    if (branchId) {
      await this.prisma.branch.findUniqueOrThrow({
        where: { id: branchId },
      });
    }
  }

  private assertCanCreateRole(actorRole: UserRole, targetRole: UserRole): void {
    if (actorRole === UserRole.OWNER) {
      return;
    }

    if (actorRole === UserRole.ADMIN && targetRole === UserRole.REGISTRADOR) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para crear usuarios con ese rol.',
    );
  }

  private assertCanManageUser(actorRole: UserRole, targetRole: UserRole): void {
    if (actorRole === UserRole.OWNER) {
      return;
    }

    if (actorRole === UserRole.ADMIN && targetRole === UserRole.REGISTRADOR) {
      return;
    }

    throw new ForbiddenException(
      'No tiene permisos para administrar ese usuario.',
    );
  }

  private toResponse(user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    branch: {
      id: string;
      name: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      branch: user.branch,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
