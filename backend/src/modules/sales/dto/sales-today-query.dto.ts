import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SalesTodayQueryDto {
  @ApiPropertyOptional({ description: 'Sucursal a consultar.' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    example: '2026-03-11',
    description: 'Fecha base en formato YYYY-MM-DD.',
  })
  @IsOptional()
  @IsString()
  date?: string;
}
