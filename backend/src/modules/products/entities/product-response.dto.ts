import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BrandResponseDto } from '../../brands/entities/brand-response.dto';

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: BrandResponseDto })
  brand!: BrandResponseDto;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  barcode!: string | null;

  @ApiProperty()
  requiresWeight!: boolean;

  @ApiProperty({ example: 12.5 })
  defaultPrice!: number;

  @ApiPropertyOptional({ nullable: true })
  photoUrl!: string | null;

  @ApiProperty()
  siatEnabled!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
