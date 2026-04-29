import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  MovementRefType,
  MovementType,
  Prisma,
  UserRole,
} from '@prisma/client';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  ensureBranchScope,
  resolveOperationalBranchId,
} from '../../common/utils/branch-scope.util';
import { getDailyRange } from '../../common/utils/date-range.util';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { EnableSalesEditDto } from './dto/enable-sales-edit.dto';
import { SalesTodayQueryDto } from './dto/sales-today-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleResponseDto } from './entities/sale-response.dto';
import { SalesEditControlResponseDto } from './entities/sales-edit-control-response.dto';
import { SiatService } from './siat.service';

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    branch: true;
    user: true;
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly siatService: SiatService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    const branchId = resolveOperationalBranchId(actor, dto.branchId);
    await this.ensureBranchActive(branchId);
    this.ensureUniqueProducts(dto);

    const sale = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: dto.items.map((item) => item.productId),
          },
        },
      });

      if (products.length !== dto.items.length) {
        throw new BadRequestException(
          'Uno o más productos de la venta no existen.',
        );
      }

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );
      const lineItems = dto.items.map((item) => {
        const product = productMap.get(item.productId);

        if (!product || !product.isActive) {
          throw new BadRequestException(
            'La venta contiene productos inexistentes o inactivos.',
          );
        }

        const unitPrice = toDecimal(
          item.unitPrice ?? decimalToNumber(product.defaultPrice) ?? 0,
        );
        const quantity = toDecimal(item.quantity);

        return {
          product,
          quantity,
          unitPrice,
          total: unitPrice.mul(quantity),
        };
      });

      const subtotal = lineItems.reduce(
        (acc, item) => acc.add(item.total),
        new Prisma.Decimal(0),
      );
      const discount = toDecimal(dto.discount ?? 0);

      if (discount.greaterThan(subtotal)) {
        throw new BadRequestException(
          'El descuento no puede ser mayor al subtotal.',
        );
      }

      const sale = await tx.sale.create({
        data: {
          branchId,
          userId: actor.sub,
          subtotal,
          discount,
          total: subtotal.sub(discount),
          invoiceEnabled: dto.invoiceEnabled ?? false,
          siatStatus: this.siatService.resolveInitialStatus(dto.invoiceEnabled),
          notes: dto.notes,
          items: {
            create: lineItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: {
          branch: true,
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      for (const item of lineItems) {
        const stockUpdate = await tx.stock.updateMany({
          where: {
            branchId,
            productId: item.product.id,
            quantity: {
              gte: item.quantity,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new BadRequestException(
            `Stock insuficiente para el producto ${item.product.name}.`,
          );
        }

        await tx.inventoryMovement.create({
          data: {
            branchId,
            productId: item.product.id,
            type: MovementType.OUT,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            refType: MovementRefType.SALE,
            refId: sale.id,
            notes: 'Salida automática por venta.',
          },
        });
      }

      return sale;
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'CREATE_SALE',
      entity: 'Sale',
      entityId: sale.id,
      metadata: {
        branchId: sale.branchId,
        total: decimalToNumber(sale.total),
        itemCount: sale.items.length,
      },
    });

    return this.toResponse(sale);
  }

  async findToday(query: SalesTodayQueryDto): Promise<SaleResponseDto[]> {
    const range = getDailyRange(query.date);
    const sales = await this.prisma.sale.findMany({
      where: {
        branchId: query.branchId,
        createdAt: {
          gte: range.start,
          lt: range.end,
        },
      },
      include: {
        branch: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sales.map((sale) => this.toResponse(sale));
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<SaleResponseDto> {
    const sale = await this.prisma.sale.findUniqueOrThrow({
      where: { id },
      include: {
        branch: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    ensureBranchScope(actor, sale.branchId);
    return this.toResponse(sale);
  }

  async enableEditWindow(
    actor: AuthenticatedUser,
    dto: EnableSalesEditDto,
  ): Promise<SalesEditControlResponseDto> {
    await this.ensureBranchActive(dto.branchId);

    const control = await this.prisma.salesEditControl.create({
      data: {
        branchId: dto.branchId,
        enabled: true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById: actor.sub,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'ENABLE_SALES_EDIT',
      entity: 'SalesEditControl',
      entityId: control.id,
      metadata: {
        branchId: control.branchId,
        expiresAt: control.expiresAt,
      },
    });

    return control;
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateSaleDto,
  ): Promise<SaleResponseDto> {
    const sale = await this.prisma.sale.findUniqueOrThrow({
      where: { id },
      include: {
        branch: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (actor.role === UserRole.REGISTRADOR) {
      ensureBranchScope(actor, sale.branchId);
    }

    const control = await this.prisma.salesEditControl.findFirst({
      where: {
        branchId: sale.branchId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (
      !control ||
      !control.enabled ||
      (control.expiresAt && control.expiresAt.getTime() < Date.now())
    ) {
      throw new ForbiddenException(
        'No existe una ventana activa de corrección para esta sucursal.',
      );
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id },
      data: {
        notes: dto.notes,
        invoiceEnabled: dto.invoiceEnabled,
        siatStatus:
          dto.invoiceEnabled !== undefined
            ? this.siatService.resolveInitialStatus(dto.invoiceEnabled)
            : undefined,
      },
      include: {
        branch: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'UPDATE_SALE',
      entity: 'Sale',
      entityId: updatedSale.id,
      metadata: {
        branchId: updatedSale.branchId,
        invoiceEnabled: updatedSale.invoiceEnabled,
        notes: updatedSale.notes,
      },
    });

    return this.toResponse(updatedSale);
  }

  private ensureUniqueProducts(dto: CreateSaleDto): void {
    const productIds = dto.items.map((item) => item.productId);
    const uniqueIds = new Set(productIds);

    if (uniqueIds.size !== productIds.length) {
      throw new BadRequestException(
        'No se permiten productos repetidos dentro de la misma venta.',
      );
    }
  }

  private async ensureBranchActive(branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (!branch.isActive) {
      throw new BadRequestException('La sucursal seleccionada está inactiva.');
    }
  }

  private toResponse(sale: SaleWithRelations): SaleResponseDto {
    return {
      id: sale.id,
      branchId: sale.branchId,
      branchName: sale.branch.name,
      userId: sale.userId,
      username: sale.user.username,
      subtotal: decimalToNumber(sale.subtotal) ?? 0,
      discount: decimalToNumber(sale.discount) ?? 0,
      total: decimalToNumber(sale.total) ?? 0,
      invoiceEnabled: sale.invoiceEnabled,
      siatStatus: sale.siatStatus,
      notes: sale.notes,
      items: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: decimalToNumber(item.quantity) ?? 0,
        unitPrice: decimalToNumber(item.unitPrice) ?? 0,
        total: decimalToNumber(item.total) ?? 0,
      })),
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    };
  }
}
