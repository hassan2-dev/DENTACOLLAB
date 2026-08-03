import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/** Zero-decimal currencies supported by Stripe (amount already in major units). */
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'IQD',
]);

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  readonly client: Stripe | null;
  readonly webhookSecret: string | null;
  readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') || null;
    this.enabled = Boolean(secret);
    this.client = secret ? new Stripe(secret) : null;
    if (!secret) {
      this.logger.warn('STRIPE_SECRET_KEY not set — payments disabled');
    }
  }

  toStripeUnitAmount(amount: number, currency: string): number {
    const code = currency.toUpperCase();
    if (ZERO_DECIMAL.has(code)) return Math.round(amount);
    return Math.round(amount * 100);
  }

  async createCheckoutSession(input: {
    paymentId: string;
    invoiceNumber: string;
    courseTitle: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    if (!this.client) {
      throw new Error('Stripe is not configured');
    }
    const currency = input.currency.toLowerCase();
    const unitAmount = this.toStripeUnitAmount(input.amount, input.currency);

    return this.client.checkout.sessions.create({
      mode: 'payment',
      customer_email: input.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: input.courseTitle,
              description: `Invoice ${input.invoiceNumber}`,
            },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        paymentId: input.paymentId,
        invoiceNumber: input.invoiceNumber,
        ...(input.metadata || {}),
      },
      payment_intent_data: {
        metadata: {
          paymentId: input.paymentId,
          invoiceNumber: input.invoiceNumber,
        },
      },
    });
  }

  constructEvent(rawBody: Buffer, signature: string) {
    if (!this.client || !this.webhookSecret) {
      throw new Error('Stripe webhook is not configured');
    }
    return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }

  async retrieveSession(sessionId: string) {
    if (!this.client) throw new Error('Stripe is not configured');
    return this.client.checkout.sessions.retrieve(sessionId);
  }
}
