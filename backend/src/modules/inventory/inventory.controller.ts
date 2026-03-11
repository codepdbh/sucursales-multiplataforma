import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { MovementsQueryDto } from './dto/movements-query.dto';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { StockQueryDto } from './dto/stock-query.dto';
import { InventoryMovementResponseDto } from './entities/inventory-movement-response.dto';
import { StockResponseDto } from './entities/stock-response.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventario')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('in')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar entrada de stock' })
  @ApiOkResponse({ type: InventoryMovementResponseDto })
  stockIn(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: StockInDto,
  ): Promise<InventoryMovementResponseDto> {
    return this.inventoryService.stockIn(actor, dto);
  }

  @Post('out')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Registrar salida de stock' })
  @ApiOkResponse({ type: InventoryMovementResponseDto })
  stockOut(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: StockOutDto,
  ): Promise<InventoryMovementResponseDto> {
    return this.inventoryService.stockOut(actor, dto);
  }

  @Get('stock')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.REGISTRADOR)
  @ApiOperation({ summary: 'Consultar stock por sucursal' })
  @ApiOkResponse({ type: StockResponseDto, isArray: true })
  getStock(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StockQueryDto,
  ): Promise<StockResponseDto[]> {
    return this.inventoryService.getStock(actor, query);
  }

  @Get('movements')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Consultar movimientos globales de inventario' })
  @ApiOkResponse({ type: InventoryMovementResponseDto, isArray: true })
  getMovements(
    @Query() query: MovementsQueryDto,
  ): Promise<InventoryMovementResponseDto[]> {
    return this.inventoryService.getMovements(query);
  }
}
