import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'admin3' })
  @IsString()
  @Length(3, 40)
  username!: string;

  @ApiProperty({ example: 'admin3@sistema.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'La contraseña debe incluir letras, números y un símbolo.',
  })
  @IsString()
  @Length(8, 64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'La contraseña debe incluir letras, números y al menos un símbolo.',
  })
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.REGISTRADOR })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    example: 'clx123branch',
    description: 'Obligatorio para REGISTRADOR y opcional para ADMIN.',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}
