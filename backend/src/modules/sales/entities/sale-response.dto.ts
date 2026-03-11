import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 12.5 })
  unitPrice!: number;

  @ApiProperty({ example: 25 })
  total!: number;
}

export class SaleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  branchId!: string;

  @ApiProperty()
  branchName!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ example: 50 })
  subtotal!: number;

  @ApiProperty({ example: 0 })
  discount!: number;

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty()
  invoiceEnabled!: boolean;

  @ApiProperty()
  siatStatus!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ type: SaleItemResponseDto, isArray: true })
  items!: SaleItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
