import { ApiProperty } from '@nestjs/swagger';

export class UploadProductPhotoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  file!: unknown;
}
