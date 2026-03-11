import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandResponseDto } from './entities/brand-response.dto';

type PrismaExecutor = Prisma.TransactionClient | PrismaService;

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
    return this.prisma.brand.create({
      data: {
        name: dto.name.trim(),
      },
    });
  }

  async findAll(): Promise<BrandResponseDto[]> {
    return this.prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOrCreateByName(
    name: string,
    executor: PrismaExecutor = this.prisma,
  ) {
    const normalizedName = name.trim();

    const existing = await executor.brand.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      return existing;
    }

    return executor.brand.create({
      data: { name: normalizedName },
    });
  }
}
