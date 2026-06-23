import { Injectable } from '@nestjs/common';
import { MovementType } from '@prisma/client';

import {
  getAnnualRange,
  getCustomRange,
  getDailyRange,
  getMonthlyRange,
  getWeeklyRange,
} from '../../common/utils/date-range.util';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { LiquidationReportDto } from './entities/liquidation-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async daily(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getDailyRange(query.date);
    return this.buildLiquidation(range.start, range.end, query.branchId, true);
  }

  async weekly(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getWeeklyRange(query.date);
    return this.buildLiquidation(range.start, range.end, query.branchId, true);
  }

  async monthly(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getMonthlyRange(query.date);
    return this.buildLiquidation(range.start, range.end, query.branchId, true);
  }

  async annual(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getAnnualRange(query.date);
    return this.buildLiquidation(range.start, range.end, query.branchId, true);
  }

  async range(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getCustomRange(query.startDate, query.endDate);
    return this.buildLiquidation(range.start, range.end, query.branchId, true);
  }

  private async buildLiquidation(
    start: Date,
    end: Date,
    branchId?: string,
    includeSalesDetails = false,
  ): Promise<LiquidationReportDto> {
    const [salesAggregate, salesCount, outMovements, salesDetailsSource] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          branchId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        _sum: {
          total: true,
        },
      }),
      this.prisma.sale.count({
        where: {
          branchId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
      this.prisma.inventoryMovement.findMany({
        where: {
          branchId,
          type: MovementType.OUT,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
      includeSalesDetails
        ? this.prisma.sale.findMany({
            where: {
              branchId,
              createdAt: {
                gte: start,
                lt: end,
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
              createdAt: 'asc',
            },
          })
        : Promise.resolve([]),
    ]);

    const incomeTotal = decimalToNumber(salesAggregate._sum.total) ?? 0;
    const outputTotal = outMovements.reduce((acc, movement) => {
      const unitPrice = decimalToNumber(movement.unitPrice) ?? 0;
      const quantity = decimalToNumber(movement.quantity) ?? 0;
      return acc + unitPrice * quantity;
    }, 0);

    return {
      periodStart: start,
      periodEnd: end,
      incomeTotal,
      outputTotal,
      netTotal: incomeTotal - outputTotal,
      salesCount,
      movementsCount: outMovements.length,
      salesDetails: salesDetailsSource.flatMap((sale) =>
        sale.items.map((item) => ({
          saleId: sale.id,
          saleItemId: item.id,
          branchId: sale.branchId,
          branchName: sale.branch.name,
          productId: item.productId,
          productName: item.product.name,
          quantity: decimalToNumber(item.quantity) ?? 0,
          unitPrice: decimalToNumber(item.unitPrice) ?? 0,
          lineTotal: decimalToNumber(item.total) ?? 0,
          userId: sale.userId,
          username: sale.user.username,
          createdAt: sale.createdAt,
        })),
      ),
    };
  }
}
