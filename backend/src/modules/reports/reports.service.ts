import { Injectable } from '@nestjs/common';
import { MovementType } from '@prisma/client';

import {
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
    return this.buildLiquidation(range.start, range.end, query.branchId);
  }

  async weekly(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getWeeklyRange(query.date);
    return this.buildLiquidation(range.start, range.end, query.branchId);
  }

  async monthly(query: ReportQueryDto): Promise<LiquidationReportDto> {
    const range = getMonthlyRange(query.date);
    return this.buildLiquidation(range.start, range.end, query.branchId);
  }

  private async buildLiquidation(
    start: Date,
    end: Date,
    branchId?: string,
  ): Promise<LiquidationReportDto> {
    const [salesAggregate, salesCount, outMovements] = await Promise.all([
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
    };
  }
}
