import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EnableSalesEditDto {
  @ApiProperty()
  @IsString()
  branchId!: string;

  @ApiPropertyOptional({
    example: '2026-03-11T23:00:00.000Z',
    description: 'Fecha de expiración opcional para la ventana de corrección.',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
