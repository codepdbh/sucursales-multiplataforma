import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateSaleDto } from './dto/create-sale.dto';
import { EnableSalesEditDto } from './dto/enable-sales-edit.dto';
import { SalesTodayQueryDto } from './dto/sales-today-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleResponseDto } from './entities/sale-response.dto';
import { SalesEditControlResponseDto } from './entities/sales-edit-control-response.dto';
import { SalesService } from './sales.service';

@ApiTags('Ventas')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.REGISTRADOR)
  @ApiOperation({ summary: 'Registrar venta' })
  @ApiCreatedResponse({ type: SaleResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.create(actor, dto);
  }

  @Get('today')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver ventas del día' })
  @ApiOkResponse({ type: SaleResponseDto, isArray: true })
  findToday(@Query() query: SalesTodayQueryDto): Promise<SaleResponseDto[]> {
    return this.salesService.findToday(query);
  }

  @Post('edit/enable')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Habilitar corrección de ventas por sucursal' })
  @ApiOkResponse({ type: SalesEditControlResponseDto })
  enableEdit(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: EnableSalesEditDto,
  ): Promise<SalesEditControlResponseDto> {
    return this.salesService.enableEditWindow(actor, dto);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.REGISTRADOR)
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiOkResponse({ type: SaleResponseDto })
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SaleResponseDto> {
    return this.salesService.findOne(actor, id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.REGISTRADOR)
  @ApiOperation({ summary: 'Corregir campos seguros de una venta' })
  @ApiOkResponse({ type: SaleResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.update(actor, id, dto);
  }
}
