import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Coca-Cola',
  })
  @IsString()
  @Length(2, 120)
  name!: string;
}
