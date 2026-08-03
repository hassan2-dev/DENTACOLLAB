import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export type InvoiceData = {
  invoiceNumber: string;
  registrationNumber?: string | null;
  studentName: string;
  courseTitle: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentStatus: string;
  email?: string;
  phone?: string;
  discountAmount?: number;
  originalAmount?: number | null;
  verifyUrl?: string;
};

type CompanyInfo = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  taxId?: string;
};

@Injectable()
export class InvoiceService {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  private formatMoney(amount: number, currency: string) {
    return `${amount.toLocaleString('en-US')} ${currency.toUpperCase()}`;
  }

  private async companyInfo(): Promise<CompanyInfo> {
    const [general, invoice] = await Promise.all([
      this.prisma.setting.findUnique({ where: { key: 'general' } }),
      this.prisma.setting.findUnique({ where: { key: 'invoice' } }),
    ]);
    const g = (general?.value || {}) as Record<string, string>;
    const i = (invoice?.value || {}) as Record<string, string>;
    return {
      name: i.companyName || g.siteName || 'DentaCollab',
      tagline: i.tagline || g.tagline || 'Digital Dentistry Academy',
      email: i.email || g.email || 'info@dentacollab.com',
      phone: i.phone || g.phone || '',
      address: i.address || g.location || '',
      logoUrl: i.logoUrl || g.logoUrl,
      taxId: i.taxId || '',
    };
  }

  async generatePdfBuffer(data: InvoiceData): Promise<Buffer> {
    const company = await this.companyInfo();
    const qrPayload =
      data.verifyUrl ||
      `DentaCollab Invoice ${data.invoiceNumber}${data.registrationNumber ? ` / ${data.registrationNumber}` : ''}`;
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 140,
      color: { dark: '#101c38', light: '#ffffff' },
    });
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = new (PDFDocument as any)({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header band
      doc.rect(0, 0, doc.page.width, 110).fill('#101c38');
      doc.fillColor('#ffffff').fontSize(22).text(company.name, 48, 36, { continued: false });
      doc.fillColor('#7be7ff').fontSize(11).text(company.tagline, 48, 66);
      doc
        .fillColor('#ffffff')
        .fontSize(18)
        .text('INVOICE', 48, 40, { align: 'right', width: doc.page.width - 96 });

      doc.fillColor('#101c38');
      let y = 130;

      doc.fontSize(10).fillColor('#64748b').text('Invoice Number', 48, y);
      doc.fontSize(12).fillColor('#101c38').text(data.invoiceNumber, 48, y + 14);
      if (data.registrationNumber) {
        doc.fontSize(10).fillColor('#64748b').text('Registration Number', 280, y);
        doc.fontSize(12).fillColor('#101c38').text(data.registrationNumber, 280, y + 14);
      }
      y += 48;

      doc.fontSize(10).fillColor('#64748b').text('Payment Date', 48, y);
      doc.fontSize(12).fillColor('#101c38').text(data.paymentDate.toISOString().slice(0, 10), 48, y + 14);
      doc.fontSize(10).fillColor('#64748b').text('Payment Status', 280, y);
      doc.fontSize(12).fillColor('#0f8aa3').text(data.paymentStatus, 280, y + 14);
      y += 52;

      // Student box
      doc.roundedRect(48, y, doc.page.width - 96, 78, 8).fill('#f8fafc');
      doc.fillColor('#101c38').fontSize(12).text('Student', 60, y + 12);
      doc.fontSize(11).fillColor('#334155');
      doc.text(data.studentName, 60, y + 32);
      if (data.email) doc.text(data.email, 60, y + 48);
      if (data.phone) doc.text(data.phone, 280, y + 32);
      y += 98;

      doc.fillColor('#101c38').fontSize(12).text('Course', 48, y);
      doc.fontSize(11).fillColor('#334155').text(data.courseTitle, 48, y + 18, {
        width: doc.page.width - 220,
      });

      // QR
      doc.image(Buffer.from(qrBase64, 'base64'), doc.page.width - 48 - 100, y - 10, {
        width: 100,
        height: 100,
      });
      y += 110;

      // Amount table
      doc.roundedRect(48, y, doc.page.width - 96, 90, 8).stroke('#e2e8f0');
      const original = data.originalAmount ?? data.amount;
      const discount = data.discountAmount || 0;
      doc.fontSize(11).fillColor('#64748b').text('Subtotal', 60, y + 16);
      doc.fillColor('#101c38').text(this.formatMoney(original, data.currency), 60, y + 16, {
        align: 'right',
        width: doc.page.width - 156,
      });
      if (discount > 0) {
        doc.fillColor('#64748b').text('Discount', 60, y + 36);
        doc
          .fillColor('#dc2626')
          .text(`- ${this.formatMoney(discount, data.currency)}`, 60, y + 36, {
            align: 'right',
            width: doc.page.width - 156,
          });
      }
      doc
        .fontSize(13)
        .fillColor('#101c38')
        .text('Total Paid', 60, y + 58);
      doc
        .fillColor('#1fb6d1')
        .fontSize(14)
        .text(this.formatMoney(data.amount, data.currency), 60, y + 58, {
          align: 'right',
          width: doc.page.width - 156,
        });

      // Company footer
      const footerY = doc.page.height - 90;
      doc
        .moveTo(48, footerY)
        .lineTo(doc.page.width - 48, footerY)
        .stroke('#e2e8f0');
      doc.fontSize(9).fillColor('#64748b');
      doc.text(company.name, 48, footerY + 12);
      const details = [company.email, company.phone, company.address, company.taxId ? `Tax: ${company.taxId}` : '']
        .filter(Boolean)
        .join('  ·  ');
      doc.text(details, 48, footerY + 28, { width: doc.page.width - 96 });
      doc
        .fillColor('#94a3b8')
        .text('Thank you for registering with DentaCollab.', 48, footerY + 48, {
          align: 'center',
          width: doc.page.width - 96,
        });

      doc.end();
    });
  }

  async generateAndUpload(data: InvoiceData) {
    const buffer = await this.generatePdfBuffer(data);
    return this.storage.uploadBuffer(
      buffer,
      `invoice-${data.invoiceNumber}.pdf`,
      'application/pdf',
      'invoices',
    );
  }
}
