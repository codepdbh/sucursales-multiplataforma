import { Injectable } from '@nestjs/common';

@Injectable()
export class SiatService {
  resolveInitialStatus(invoiceEnabled?: boolean): string {
    return invoiceEnabled ? 'PENDING' : 'NONE';
  }
}
