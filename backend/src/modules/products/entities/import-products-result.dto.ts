import { ApiProperty } from '@nestjs/swagger';

export class ImportProductsResultDto {
  @ApiProperty()
  createdProducts!: number;

  @ApiProperty()
  updatedProducts!: number;

  @ApiProperty()
  stockRowsProcessed!: number;

  @ApiProperty()
  branchId!: string;
}
