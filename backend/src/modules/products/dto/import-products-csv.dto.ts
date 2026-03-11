import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ImportProductsCsvDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Archivo CSV con columnas como Marca, producto, cantidad, precio, barcode, requiresWeight y siatEnabled.',
  })
  file!: unknown;

  @ApiPropertyOptional({
    description: 'Sucursal destino. Obligatoria para OWNER y ADMIN.',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}
