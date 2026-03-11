import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { UserResponseDto } from '../users/entities/user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const login = dto.login.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: login }, { email: login.toLowerCase() }],
      },
      include: {
        branch: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('El usuario está inactivo.');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
    });

    await this.auditLogService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: user.id,
      metadata: {
        username: user.username,
        role: user.role,
      },
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: this.toUserResponse(user),
    };
  }

  async me(currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: currentUser.sub,
      },
      include: {
        branch: true,
      },
    });

    if (!user.isActive) {
      throw new ForbiddenException('El usuario está inactivo.');
    }

    return this.toUserResponse(user);
  }

  private toUserResponse(user: {
    id: string;
    username: string;
    email: string;
    role: import('@prisma/client').UserRole;
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
