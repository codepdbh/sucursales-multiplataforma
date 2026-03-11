import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'owner',
    description: 'Puede ser username o email.',
  })
  @IsString()
  @Length(3, 120)
  login!: string;

  @ApiProperty({
    example: 'Owner12345!',
  })
  @IsString()
  @Length(8, 64)
  password!: string;
}
