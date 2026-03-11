import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './entities/branch-response.dto';
import { BranchesService } from './branches.service';

@ApiTags('Sucursales')
@ApiBearerAuth()
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiCreatedResponse({ type: BranchResponseDto })
  create(@Body() dto: CreateBranchDto): Promise<BranchResponseDto> {
    return this.branchesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sucursales' })
  @ApiOkResponse({ type: BranchResponseDto, isArray: true })
  findAll(): Promise<BranchResponseDto[]> {
    return this.branchesService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar o activar/desactivar sucursal' })
  @ApiOkResponse({ type: BranchResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.update(id, dto);
  }
}
