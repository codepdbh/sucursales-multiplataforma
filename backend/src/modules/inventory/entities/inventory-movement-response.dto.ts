import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementRefType, MovementType } from '@prisma/client';

export class InventoryMovementResponseDto {
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

  @ApiProperty({ enum: MovementType })
  type!: MovementType;

  @ApiProperty({ example: 5 })
  quantity!: number;

  @ApiPropertyOptional({ example: 12.5, nullable: true })
  unitPrice!: number | null;

  @ApiPropertyOptional({ enum: MovementRefType, nullable: true })
  refType!: MovementRefType | null;

  @ApiPropertyOptional({ nullable: true })
  refId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
