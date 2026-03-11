import { BadRequestException, Injectable } from '@nestjs/common';
import { MovementRefType, MovementType, Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  ensureBranchScope,
  resolveOperationalBranchId,
} from '../../common/utils/branch-scope.util';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MovementsQueryDto } from './dto/movements-query.dto';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { InventoryMovementResponseDto } from './entities/inventory-movement-response.dto';
import { StockResponseDto } from './entities/stock-response.dto';

type MovementWithRelations = Prisma.InventoryMovementGetPayload<{
  include: {
    branch: true;
    product: true;
  };
}>;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async stockIn(
    actor: AuthenticatedUser,
    dto: StockInDto,
  ): Promise<InventoryMovementResponseDto> {
    const branchId = resolveOperationalBranchId(actor, dto.branchId);
    const product = await this.ensureBranchAndProduct(branchId, dto.productId);
    const unitPrice = toDecimal(
      dto.unitPrice ?? decimalToNumber(product.defaultPrice) ?? 0,
    );

    const movement = await this.prisma.$transaction(async (tx) => {
      await tx.stock.upsert({
        where: {
          branchId_productId: {
            branchId,
            productId: dto.productId,
          },
        },
        update: {
          quantity: {
            increment: toDecimal(dto.quantity),
          },
        },
        create: {
          branchId,
          productId: dto.productId,
          quantity: toDecimal(dto.quantity),
        },
      });

      return tx.inventoryMovement.create({
        data: {
          branchId,
          productId: dto.productId,
          type: MovementType.IN,
          quantity: toDecimal(dto.quantity),
          unitPrice,
          refType: MovementRefType.MANUAL,
          notes: dto.notes ?? 'Entrada manual de inventario.',
        },
        include: {
          branch: true,
          product: true,
        },
      });
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'STOCK_IN',
      entity: 'InventoryMovement',
      entityId: movement.id,
      metadata: {
        branchId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });

    return this.toMovementResponse(movement);
  }

  async stockOut(
    actor: AuthenticatedUser,
    dto: StockOutDto,
  ): Promise<InventoryMovementResponseDto> {
    const branchId = resolveOperationalBranchId(actor, dto.branchId);
    const product = await this.ensureBranchAndProduct(branchId, dto.productId);
    const currentStock = await this.prisma.stock.findUnique({
      where: {
        branchId_productId: {
          branchId,
          productId: dto.productId,
        },
      },
    });

    if (!currentStock || currentStock.quantity.lessThan(dto.quantity)) {
      throw new BadRequestException(
        'Stock insuficiente para realizar la salida.',
      );
    }

    const unitPrice = toDecimal(
      dto.unitPrice ?? decimalToNumber(product.defaultPrice) ?? 0,
    );
    const movement = await this.prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: {
          branchId_productId: {
            branchId,
            productId: dto.productId,
          },
        },
        data: {
          quantity: {
            decrement: toDecimal(dto.quantity),
          },
        },
      });

      return tx.inventoryMovement.create({
        data: {
          branchId,
          productId: dto.productId,
          type: MovementType.OUT,
          quantity: toDecimal(dto.quantity),
          unitPrice,
          refType: MovementRefType.MANUAL,
          notes: dto.notes ?? 'Salida manual de inventario.',
        },
        include: {
          branch: true,
          product: true,
        },
      });
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'STOCK_OUT',
      entity: 'InventoryMovement',
      entityId: movement.id,
      metadata: {
        branchId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });

    return this.toMovementResponse(movement);
  }

  async getStock(
    actor: AuthenticatedUser,
    query: StockQueryDto,
  ): Promise<StockResponseDto[]> {
    const branchId =
      actor.branchId && !query.branchId ? actor.branchId : query.branchId;

    if (branchId) {
      ensureBranchScope(actor, branchId);
    }

    const stocks = await this.prisma.stock.findMany({
      where: {
        branchId,
        productId: query.productId,
      },
      include: {
        branch: true,
        product: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        branch: {
          name: 'asc',
        },
      },
    });

    return stocks.map((stock) => ({
      id: stock.id,
      branchId: stock.branchId,
      branchName: stock.branch.name,
      productId: stock.productId,
      productName: stock.product.name,
      brandName: stock.product.brand.name,
      quantity: decimalToNumber(stock.quantity) ?? 0,
    }));
  }

  async getMovements(
    query: MovementsQueryDto,
  ): Promise<InventoryMovementResponseDto[]> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        branchId: query.branchId,
        productId: query.productId,
        type: query.type,
        createdAt: {
          gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
          lte: query.dateTo ? new Date(query.dateTo) : undefined,
        },
      },
      include: {
        branch: true,
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movement) => this.toMovementResponse(movement));
  }

  private async ensureBranchAndProduct(branchId: string, productId: string) {
    const [branch, product] = await Promise.all([
      this.prisma.branch.findUniqueOrThrow({
        where: { id: branchId },
      }),
      this.prisma.product.findUniqueOrThrow({
        where: { id: productId },
      }),
    ]);

    if (!branch.isActive) {
      throw new BadRequestException('La sucursal seleccionada está inactiva.');
    }

    if (!product.isActive) {
      throw new BadRequestException('El producto seleccionado está inactivo.');
    }

    return product;
  }

  private toMovementResponse(
    movement: MovementWithRelations,
  ): InventoryMovementResponseDto {
    return {
      id: movement.id,
      branchId: movement.branchId,
      branchName: movement.branch.name,
      productId: movement.productId,
      productName: movement.product.name,
      type: movement.type,
      quantity: decimalToNumber(movement.quantity) ?? 0,
      unitPrice: decimalToNumber(movement.unitPrice),
      refType: movement.refType,
      refId: movement.refId,
      notes: movement.notes,
      createdAt: movement.createdAt,
    };
  }
}
