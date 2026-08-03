import { Global, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { InvoiceService } from './invoice.service';

@Global()
@Module({
  providers: [StripeService, InvoiceService],
  exports: [StripeService, InvoiceService],
})
export class PaymentsInfraModule {}
