import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/entities/user-response.dto';

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
