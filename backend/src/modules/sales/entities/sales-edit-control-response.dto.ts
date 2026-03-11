import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SalesEditControlResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  branchId!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: Date | null;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  createdAt!: Date;
}
