import { ApiProperty } from '@nestjs/swagger';

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
}
