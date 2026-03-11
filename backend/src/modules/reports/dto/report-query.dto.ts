import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha base para el cálculo en formato YYYY-MM-DD.',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Sucursal opcional para filtrar el reporte.',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}
