import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { ReportQueryDto } from './dto/report-query.dto';
import { LiquidationReportDto } from './entities/liquidation-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@Roles(UserRole.OWNER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('liquidation/daily')
  @ApiOperation({ summary: 'Reporte de liquidación diaria' })
  @ApiOkResponse({ type: LiquidationReportDto })
  daily(@Query() query: ReportQueryDto): Promise<LiquidationReportDto> {
    return this.reportsService.daily(query);
  }

  @Get('liquidation/weekly')
  @ApiOperation({ summary: 'Reporte de liquidación semanal' })
  @ApiOkResponse({ type: LiquidationReportDto })
  weekly(@Query() query: ReportQueryDto): Promise<LiquidationReportDto> {
    return this.reportsService.weekly(query);
  }

  @Get('liquidation/monthly')
  @ApiOperation({ summary: 'Reporte de liquidación mensual' })
  @ApiOkResponse({ type: LiquidationReportDto })
  monthly(@Query() query: ReportQueryDto): Promise<LiquidationReportDto> {
    return this.reportsService.monthly(query);
  }
}
