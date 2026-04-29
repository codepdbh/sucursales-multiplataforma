import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StockInDto {
  @ApiPropertyOptional({
    description:
      'Sucursal objetivo. Para REGISTRADOR se ignora y se usa la del token.',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: 5 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 'Ajuste por ingreso manual' })
  @IsOptional()
  @IsString()
  notes?: string;
}
