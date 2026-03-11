import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './entities/branch-response.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBranchDto): Promise<BranchResponseDto> {
    const branch = await this.prisma.branch.create({
      data: {
        name: dto.name.trim(),
      },
    });

    return branch;
  }

  async findAll(): Promise<BranchResponseDto[]> {
    return this.prisma.branch.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(id: string, dto: UpdateBranchDto): Promise<BranchResponseDto> {
    return this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
    });
  }
}
