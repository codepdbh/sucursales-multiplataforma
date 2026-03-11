import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({
    example: 'Sucursal San Pedro',
    description: 'Nombre único de la sucursal.',
  })
  @IsString()
  @Length(2, 120)
  name!: string;
}
