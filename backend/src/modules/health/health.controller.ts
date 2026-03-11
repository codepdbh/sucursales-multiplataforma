import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificar estado del servicio' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'inventory-backend',
        timestamp: '2026-03-11T19:00:00.000Z',
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'inventory-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
