import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { StorageService } from '../storage/storage.service';

export type InvoiceData = {
  invoiceNumber: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentStatus: string;
  email?: string;
  phone?: string;
};

@Injectable()
export class InvoiceService {
  constructor(private readonly storage: StorageService) {}

  private formatMoney(amount: number, currency: string) {
    const formatted = amount.toLocaleString('en-US');
    return `${formatted} ${currency.toUpperCase()}`;
  }

  async generatePdfBuffer(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = new (PDFDocument as any)({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fillColor('#101c38')
        .fontSize(22)
        .text('DentaCollab', { align: 'left' })
        .fontSize(11)
        .fillColor('#1fb6d1')
        .text('Digital Dentistry Academy', { align: 'left' });

      doc.moveDown(1.5);
      doc.fillColor('#101c38').fontSize(18).text('INVOICE', { align: 'left' });
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor('#334155');
      doc.text(`Invoice Number: ${data.invoiceNumber}`);
      doc.text(`Payment Date: ${data.paymentDate.toISOString().slice(0, 10)}`);
      doc.text(`Payment Status: ${data.paymentStatus}`);
      doc.moveDown();

      doc.fillColor('#101c38').fontSize(13).text('Student');
      doc.fontSize(11).fillColor('#334155');
      doc.text(`Name: ${data.studentName}`);
      if (data.email) doc.text(`Email: ${data.email}`);
      if (data.phone) doc.text(`Phone: ${data.phone}`);
      doc.moveDown();

      doc.fillColor('#101c38').fontSize(13).text('Course');
      doc.fontSize(11).fillColor('#334155').text(data.courseTitle);
      doc.moveDown();

      doc.fillColor('#101c38').fontSize(13).text('Amount');
      doc
        .fontSize(16)
        .fillColor('#1fb6d1')
        .text(this.formatMoney(data.amount, data.currency));

      doc.moveDown(3);
      doc
        .fontSize(9)
        .fillColor('#94a3b8')
        .text('Thank you for registering with DentaCollab.', { align: 'center' });

      doc.end();
    });
  }

  async generateAndUpload(data: InvoiceData) {
    const buffer = await this.generatePdfBuffer(data);
    const uploaded = await this.storage.uploadBuffer(
      buffer,
      `invoice-${data.invoiceNumber}.pdf`,
      'application/pdf',
      'invoices',
    );
    return uploaded;
  }
}
