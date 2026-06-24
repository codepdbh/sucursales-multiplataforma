import { ApiProperty } from '@nestjs/swagger';

export class LiquidationSaleDetailDto {
  @ApiProperty()
  saleId!: string;

  @ApiProperty()
  saleItemId!: string;

  @ApiProperty()
  branchId!: string;

  @ApiProperty()
  branchName!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 27 })
  unitPrice!: number;

  @ApiProperty({ example: 54 })
  lineTotal!: number;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class LiquidationReportDto {
  @ApiProperty()
  periodStart!: Date;

  @ApiProperty()
  periodEnd!: Date;

  @ApiProperty({ example: 1500 })
  incomeTotal!: number;

  @ApiProperty({ example: 900 })
  outputTotal!: number;

  @ApiProperty({ example: 600 })
  netTotal!: number;

  @ApiProperty()
  salesCount!: number;

  @ApiProperty()
  movementsCount!: number;

  @ApiProperty({ type: LiquidationSaleDetailDto, isArray: true })
  salesDetails!: LiquidationSaleDetailDto[];
}
