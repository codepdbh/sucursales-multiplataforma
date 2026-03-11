import { Module } from '@nestjs/common';

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SiatService } from './siat.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService, SiatService],
  exports: [SalesService, SiatService],
})
export class SalesModule {}
