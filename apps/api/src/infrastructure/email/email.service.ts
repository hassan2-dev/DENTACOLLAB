import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

type PaymentEmailPayload = {
  to: string;
  fullName: string;
  courseTitle: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  invoicePdfUrl?: string | null;
  locale?: 'ar' | 'en';
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from =
      this.config.get<string>('RESEND_FROM_EMAIL') ||
      'DentaCollab <onboarding@resend.dev>';
    this.enabled = Boolean(apiKey);
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set — email notifications disabled');
    }
  }

  private formatMoney(amount: number, currency: string, locale: 'ar' | 'en') {
    const formatted = amount.toLocaleString(locale === 'ar' ? 'ar-IQ' : 'en-US');
    if (currency.toUpperCase() === 'USD') return locale === 'ar' ? `${formatted} $` : `$${formatted}`;
    if (currency.toUpperCase() === 'IQD') return locale === 'ar' ? `${formatted} د.ع` : `${formatted} IQD`;
    return `${formatted} ${currency}`;
  }

  async sendRegistrationConfirmation(payload: PaymentEmailPayload) {
    const locale = payload.locale || 'ar';
    const isAr = locale === 'ar';
    const subject = isAr
      ? `تأكيد التسجيل — ${payload.courseTitle}`
      : `Registration confirmed — ${payload.courseTitle}`;
    const html = isAr
      ? `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.7">
          <h2>تم تأكيد تسجيلك</h2>
          <p>مرحباً ${payload.fullName}،</p>
          <p>تم تسجيل طلبك في دورة <strong>${payload.courseTitle}</strong> بنجاح.</p>
          <p>رقم الفاتورة: <strong>${payload.invoiceNumber}</strong></p>
          <p>المبلغ: <strong>${this.formatMoney(payload.amount, payload.currency, 'ar')}</strong></p>
          <p>شكراً لانضمامك إلى DentaCollab.</p>
        </div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.7">
          <h2>Registration confirmed</h2>
          <p>Hello ${payload.fullName},</p>
          <p>Your registration for <strong>${payload.courseTitle}</strong> is confirmed.</p>
          <p>Invoice: <strong>${payload.invoiceNumber}</strong></p>
          <p>Amount: <strong>${this.formatMoney(payload.amount, payload.currency, 'en')}</strong></p>
          <p>Thank you for joining DentaCollab.</p>
        </div>`;
    return this.send(payload.to, subject, html);
  }

  async sendPaymentConfirmation(payload: PaymentEmailPayload) {
    const locale = payload.locale || 'ar';
    const isAr = locale === 'ar';
    const subject = isAr
      ? `تأكيد الدفع — ${payload.invoiceNumber}`
      : `Payment confirmation — ${payload.invoiceNumber}`;
    const invoiceLink = payload.invoicePdfUrl
      ? isAr
        ? `<p><a href="${payload.invoicePdfUrl}">تحميل الفاتورة PDF</a></p>`
        : `<p><a href="${payload.invoicePdfUrl}">Download invoice PDF</a></p>`
      : '';
    const html = isAr
      ? `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.7">
          <h2>تم استلام الدفع بنجاح</h2>
          <p>مرحباً ${payload.fullName}،</p>
          <p>تم تأكيد دفعك لدورة <strong>${payload.courseTitle}</strong>.</p>
          <p>رقم الفاتورة: <strong>${payload.invoiceNumber}</strong></p>
          <p>المبلغ: <strong>${this.formatMoney(payload.amount, payload.currency, 'ar')}</strong></p>
          ${invoiceLink}
        </div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.7">
          <h2>Payment received</h2>
          <p>Hello ${payload.fullName},</p>
          <p>Your payment for <strong>${payload.courseTitle}</strong> was successful.</p>
          <p>Invoice: <strong>${payload.invoiceNumber}</strong></p>
          <p>Amount: <strong>${this.formatMoney(payload.amount, payload.currency, 'en')}</strong></p>
          ${invoiceLink}
        </div>`;
    return this.send(payload.to, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.enabled || !this.resend) {
      this.logger.debug(`Skip email to ${to}: ${subject}`);
      return { skipped: true };
    }
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (result.error) {
        this.logger.error(`Resend error: ${result.error.message}`);
        return { ok: false, error: result.error.message };
      }
      return { ok: true, id: result.data?.id };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error as Error);
      return { ok: false };
    }
  }
}
