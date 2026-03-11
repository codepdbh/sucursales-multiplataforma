import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateProductDto {
  @ApiPropertyOptional({
    example: 'clx-brand-id',
    description: 'ID de marca existente.',
  })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    example: 'Coca-Cola',
    description: 'Si no existe la marca, se creará automáticamente.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  brandName?: string;

  @ApiProperty({ example: 'Coca-Cola 2L' })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @Length(3, 80)
  barcode?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresWeight?: boolean;

  @ApiProperty({ example: 15.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  defaultPrice!: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  siatEnabled?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
