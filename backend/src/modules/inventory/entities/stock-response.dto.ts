import { ApiProperty } from '@nestjs/swagger';

export class StockResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  branchId!: string;

  @ApiProperty()
  branchName!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  brandName!: string;

  @ApiProperty({ example: 12.5 })
  quantity!: number;
}
