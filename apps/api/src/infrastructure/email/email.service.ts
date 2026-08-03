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

  private formatMoney(amount: number, currency: string) {
    const formatted = amount.toLocaleString('en-US');
    return `${formatted} ${currency.toUpperCase()}`;
  }

  private invoiceButton(url: string | null | undefined, isAr: boolean) {
    if (!url) return '';
    const label = isAr ? '📄 تحميل الفاتورة (Download Invoice)' : '📄 Download Invoice';
    return `
      <div style="margin:28px 0 8px">
        <a href="${url}"
           style="display:inline-block;background:#101c38;color:#ffffff;text-decoration:none;
                  font-weight:700;font-size:15px;padding:14px 22px;border-radius:10px">
          ${label}
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#64748b">
        ${isAr ? 'إذا لم يعمل الزر، انسخ الرابط التالي:' : 'If the button does not work, copy this link:'}
        <br/>
        <a href="${url}" style="color:#0f8aa3;word-break:break-all">${url}</a>
      </p>`;
  }

  private detailRow(label: string, value: string, isAr: boolean) {
    const align = isAr ? 'right' : 'left';
    return `
      <tr>
        <td style="padding:10px 0 4px;font-size:13px;color:#64748b;text-align:${align}">${label}</td>
      </tr>
      <tr>
        <td style="padding:0 0 14px;font-size:16px;color:#101c38;font-weight:700;text-align:${align}">${value}</td>
      </tr>`;
  }

  private wrapEmail(opts: {
    isAr: boolean;
    title: string;
    greeting: string;
    intro: string;
    rows: Array<[string, string]>;
    footer: string;
    invoicePdfUrl?: string | null;
  }) {
    const dir = opts.isAr ? 'rtl' : 'ltr';
    const font = opts.isAr ? 'Tahoma,Arial,sans-serif' : 'Arial,Helvetica,sans-serif';
    const rowsHtml = opts.rows.map(([label, value]) => this.detailRow(label, value, opts.isAr)).join('');
    return `
      <div dir="${dir}" style="margin:0;padding:0;background:#f1f5f9">
        <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:${font};line-height:1.7;color:#334155">
          <div style="background:#101c38;border-radius:14px 14px 0 0;padding:22px 24px">
            <div style="font-size:20px;font-weight:700;color:#ffffff">DentaCollab</div>
            <div style="font-size:13px;color:#7be7ff;margin-top:4px">Digital Dentistry Academy</div>
          </div>
          <div style="background:#ffffff;border-radius:0 0 14px 14px;padding:28px 24px;border:1px solid #e2e8f0;border-top:0">
            <h1 style="margin:0 0 12px;font-size:22px;color:#101c38">${opts.title}</h1>
            <p style="margin:0 0 8px">${opts.greeting}</p>
            <p style="margin:0 0 20px">${opts.intro}</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                   style="width:100%;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 0;margin:0 0 8px">
              ${rowsHtml}
            </table>
            ${this.invoiceButton(opts.invoicePdfUrl, opts.isAr)}
            <p style="margin:24px 0 0;color:#475569">${opts.footer}</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#94a3b8;margin:18px 0 0">© DentaCollab</p>
        </div>
      </div>`;
  }

  async sendRegistrationConfirmation(payload: PaymentEmailPayload) {
    const locale = payload.locale || 'ar';
    const isAr = locale === 'ar';
    const subject = isAr
      ? `تأكيد التسجيل — ${payload.courseTitle}`
      : `Registration confirmed — ${payload.courseTitle}`;
    const html = this.wrapEmail({
      isAr,
      title: isAr ? 'تم تسجيلك بنجاح 🎉' : 'Registration successful 🎉',
      greeting: isAr ? `مرحباً ${payload.fullName}،` : `Hello ${payload.fullName},`,
      intro: isAr
        ? 'تم تسجيل طلبك بنجاح. إليك تفاصيل التسجيل:'
        : 'Your registration was received successfully. Here are the details:',
      rows: isAr
        ? [
            ['اسم الدورة', payload.courseTitle],
            ['رقم الفاتورة', payload.invoiceNumber],
            ['المبلغ', this.formatMoney(payload.amount, payload.currency)],
          ]
        : [
            ['Course', payload.courseTitle],
            ['Invoice number', payload.invoiceNumber],
            ['Amount', this.formatMoney(payload.amount, payload.currency)],
          ],
      footer: isAr
        ? 'شكراً لانضمامك إلى DentaCollab.'
        : 'Thank you for joining DentaCollab.',
      invoicePdfUrl: payload.invoicePdfUrl,
    });
    return this.send(payload.to, subject, html);
  }

  async sendPaymentConfirmation(payload: PaymentEmailPayload) {
    const locale = payload.locale || 'ar';
    const isAr = locale === 'ar';
    const subject = isAr
      ? `تأكيد الدفع — ${payload.invoiceNumber}`
      : `Payment confirmation — ${payload.invoiceNumber}`;
    const html = this.wrapEmail({
      isAr,
      title: isAr ? 'تم تسجيلك بنجاح 🎉' : 'Payment confirmed 🎉',
      greeting: isAr ? `مرحباً ${payload.fullName}،` : `Hello ${payload.fullName},`,
      intro: isAr
        ? 'تم استلام الدفع وتأكيد تسجيلك. إليك التفاصيل:'
        : 'Your payment was received and your registration is confirmed. Details below:',
      rows: isAr
        ? [
            ['اسم الدورة', payload.courseTitle],
            ['رقم الفاتورة', payload.invoiceNumber],
            ['المبلغ', this.formatMoney(payload.amount, payload.currency)],
          ]
        : [
            ['Course', payload.courseTitle],
            ['Invoice number', payload.invoiceNumber],
            ['Amount', this.formatMoney(payload.amount, payload.currency)],
          ],
      footer: isAr
        ? 'شكراً لانضمامك إلى DentaCollab.'
        : 'Thank you for joining DentaCollab.',
      invoicePdfUrl: payload.invoicePdfUrl,
    });
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
