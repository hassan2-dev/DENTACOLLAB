import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FormFieldType,
  PaymentProvider,
  PaymentStatus,
  PublishStatus,
  RegistrationStatus,
} from '@prisma/client';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import Stripe from 'stripe';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StripeService } from '../../infrastructure/payments/stripe.service';
import { InvoiceService } from '../../infrastructure/payments/invoice.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { isRegistrationOpen } from '../../common/registration-window';
import { CreateCheckoutSessionDto } from './payments.dto';

const CORE_KEYS = ['fullName', 'phone', 'email', 'city', 'occupation', 'experience', 'notes'] as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly invoices: InvoiceService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  private webBase() {
    return (this.config.get<string>('WEB_PUBLIC_URL') || 'http://localhost:5173').replace(/\/$/, '');
  }

  private async nextInvoiceNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `INV-${y}${m}${d}`;
    const count = await this.prisma.payment.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async resolveCourse(courseIdOrSlug: string) {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  private async validateAnswers(courseId: string, dto: CreateCheckoutSessionDto) {
    const fields = await this.prisma.courseFormField.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
    });
    const answers: Record<string, string> = { ...(dto.answers || {}) };

    for (const key of CORE_KEYS) {
      const value = dto[key as keyof CreateCheckoutSessionDto];
      if (typeof value === 'string' && value.trim() && !answers[key]) {
        answers[key] = value.trim();
      }
    }

    for (const field of fields) {
      const raw = answers[field.key];
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (field.required && !value) {
        throw new BadRequestException(`Missing required field: ${field.key}`);
      }
      if (field.type === FormFieldType.EMAIL && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new BadRequestException(`Invalid email for field: ${field.key}`);
        }
      }
      answers[field.key] = value;
    }

    const fullName = answers.fullName || '';
    const phone = answers.phone || '';
    const email = answers.email || '';
    if (!fullName || !phone || !email) {
      throw new BadRequestException('fullName, phone and email are required');
    }

    return { answers, fullName, phone, email };
  }

  async createSession(dto: CreateCheckoutSessionDto) {
    if (!this.stripe.enabled || !this.stripe.client) {
      throw new ServiceUnavailableException('Stripe payments are not configured');
    }

    const course = await this.resolveCourse(dto.courseIdOrSlug);
    if (course.status !== PublishStatus.PUBLISHED) {
      throw new BadRequestException('Course is not open for registration');
    }
    if (!isRegistrationOpen(course)) {
      throw new BadRequestException('Registration is closed for this course');
    }
    if (course.price == null || course.price <= 0) {
      throw new BadRequestException('This course has no payable price configured');
    }

    const { answers, fullName, phone, email } = await this.validateAnswers(course.id, dto);
    const currency = (course.currency || 'USD').toUpperCase();
    const amount = course.price;
    const invoiceNumber = await this.nextInvoiceNumber();
    const locale = dto.locale === 'en' ? 'en' : 'ar';

    const payment = await this.prisma.payment.create({
      data: {
        courseId: course.id,
        fullName,
        phone,
        email,
        answers,
        provider: PaymentProvider.STRIPE,
        invoiceNumber,
        amount,
        currency,
        paymentStatus: PaymentStatus.PENDING,
        metadata: { locale },
      },
    });

    const successUrl = `${this.webBase()}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.webBase()}/payments/cancel?course=${encodeURIComponent(course.slug)}&payment_id=${payment.id}`;

    try {
      const session = await this.stripe.createCheckoutSession({
        paymentId: payment.id,
        invoiceNumber,
        courseTitle: course.title,
        amount,
        currency,
        customerEmail: email,
        customerName: fullName,
        successUrl,
        cancelUrl,
        metadata: { courseId: course.id, courseSlug: course.slug },
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { stripeSessionId: session.id },
      });

      return {
        paymentId: payment.id,
        invoiceNumber,
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
      this.logger.error('Failed to create Stripe session', error as Error);
      throw new BadRequestException('Unable to create checkout session');
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (error) {
      this.logger.warn(`Webhook signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await this.onCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await this.onPaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  private async onCheckoutExpired(session: Stripe.Checkout.Session) {
    if (!session.id) return;
    await this.prisma.payment.updateMany({
      where: {
        stripeSessionId: session.id,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: { paymentStatus: PaymentStatus.CANCELLED },
    });
  }

  private async onPaymentFailed(intent: Stripe.PaymentIntent) {
    const paymentId = intent.metadata?.paymentId;
    if (!paymentId) return;
    await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        stripePaymentIntentId: intent.id,
      },
    });
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const paymentId = session.metadata?.paymentId;
    const payment =
      (paymentId
        ? await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { course: true, registration: true },
          })
        : null) ||
      (session.id
        ? await this.prisma.payment.findUnique({
            where: { stripeSessionId: session.id },
            include: { course: true, registration: true },
          })
        : null);

    if (!payment) {
      this.logger.warn(`Payment not found for session ${session.id}`);
      return;
    }

    // Security: only webhook marks Paid. Idempotent if already paid.
    if (payment.paymentStatus === PaymentStatus.PAID) {
      return;
    }

    if (session.payment_status !== 'paid') {
      this.logger.warn(`Session ${session.id} completed but not paid (${session.payment_status})`);
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const answers = (payment.answers as Record<string, string> | null) || {};

    const registration = await this.prisma.courseRegistration.create({
      data: {
        courseId: payment.courseId,
        fullName: payment.fullName,
        phone: payment.phone,
        email: payment.email,
        city: answers.city || '',
        occupation: answers.occupation || '',
        experience: answers.experience || '',
        notes: answers.notes || null,
        answers,
        status: RegistrationStatus.CONFIRMED,
      },
    });

    let invoicePdfUrl: string | null = null;
    let invoicePdfKey: string | null = null;
    try {
      const uploaded = await this.invoices.generateAndUpload({
        invoiceNumber: payment.invoiceNumber,
        studentName: payment.fullName,
        courseTitle: payment.course.title,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: new Date(),
        paymentStatus: 'PAID',
        email: payment.email,
        phone: payment.phone,
      });
      invoicePdfUrl = uploaded.url;
      invoicePdfKey = uploaded.key;
    } catch (error) {
      this.logger.error('Failed to generate invoice PDF', error as Error);
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        registrationId: registration.id,
        stripePaymentIntentId: paymentIntentId,
        stripeSessionId: session.id,
        invoicePdfUrl,
        invoicePdfKey,
        paidAt: new Date(),
      },
      include: { course: true },
    });

    await this.prisma.notification.create({
      data: {
        title: 'دفعة ناجحة',
        body: `${payment.fullName} دفع رسوم ${payment.course.title} — ${payment.invoiceNumber}`,
        link: `/payments`,
      },
    });

    const locale =
      (payment.metadata as { locale?: string } | null)?.locale === 'en' ? 'en' : 'ar';

    const emailPayload = {
      to: payment.email,
      fullName: payment.fullName,
      courseTitle: payment.course.title,
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount,
      currency: payment.currency,
      invoicePdfUrl,
      locale: locale as 'ar' | 'en',
    };

    await Promise.allSettled([
      this.email.sendRegistrationConfirmation(emailPayload),
      this.email.sendPaymentConfirmation(emailPayload),
    ]);

    return updated;
  }

  async markCancelled(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Paid payments cannot be cancelled');
    }
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: PaymentStatus.CANCELLED },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });
  }

  async byId(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true, coverUrl: true } },
        registration: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async bySessionId(sessionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: {
        course: { select: { id: true, title: true, slug: true, coverUrl: true } },
        registration: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getInvoice(id: string) {
    const payment = await this.byId(id);
    if (payment.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Invoice is only available after successful payment');
    }
    if (!payment.invoicePdfUrl) {
      throw new NotFoundException('Invoice PDF not found');
    }
    return {
      invoiceNumber: payment.invoiceNumber,
      invoicePdfUrl: payment.invoicePdfUrl,
      paymentId: payment.id,
    };
  }

  list(params: { q?: string; status?: PaymentStatus; courseId?: string }) {
    const q = params.q?.trim();
    return this.prisma.payment.findMany({
      where: {
        paymentStatus: params.status,
        courseId: params.courseId,
        OR: q
          ? [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { invoiceNumber: { contains: q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        registration: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportExcel(res: Response, params: { q?: string; status?: PaymentStatus } = {}) {
    const rows = await this.list(params);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payments');
    sheet.columns = [
      { header: 'Invoice', key: 'invoiceNumber', width: 20 },
      { header: 'Name', key: 'fullName', width: 24 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Course', key: 'course', width: 28 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Provider', key: 'provider', width: 12 },
      { header: 'Stripe Session', key: 'session', width: 28 },
      { header: 'Paid At', key: 'paidAt', width: 22 },
      { header: 'Created At', key: 'createdAt', width: 22 },
      { header: 'Invoice PDF', key: 'invoicePdfUrl', width: 40 },
    ];
    for (const row of rows) {
      sheet.addRow({
        invoiceNumber: row.invoiceNumber,
        fullName: row.fullName,
        phone: row.phone,
        email: row.email,
        course: row.course.title,
        amount: row.amount,
        currency: row.currency,
        status: row.paymentStatus,
        provider: row.provider,
        session: row.stripeSessionId || '',
        paidAt: row.paidAt?.toISOString() || '',
        createdAt: row.createdAt.toISOString(),
        invoicePdfUrl: row.invoicePdfUrl || '',
      });
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async dashboardStats() {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayPayments, monthPaid, totalRegistrations, recentPayments, latestRegistrations, monthRevenueAgg] =
      await Promise.all([
        this.prisma.payment.count({
          where: {
            paymentStatus: PaymentStatus.PAID,
            paidAt: { gte: dayStart },
          },
        }),
        this.prisma.payment.findMany({
          where: {
            paymentStatus: PaymentStatus.PAID,
            paidAt: { gte: monthStart },
          },
          select: { amount: true, currency: true },
        }),
        this.prisma.courseRegistration.count(),
        this.prisma.payment.findMany({
          where: { paymentStatus: PaymentStatus.PAID },
          include: { course: { select: { title: true, slug: true } } },
          orderBy: { paidAt: 'desc' },
          take: 8,
        }),
        this.prisma.courseRegistration.findMany({
          include: { course: { select: { title: true, slug: true } } },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.payment.aggregate({
          where: {
            paymentStatus: PaymentStatus.PAID,
            paidAt: { gte: monthStart },
          },
          _sum: { amount: true },
        }),
      ]);

    const revenueByCurrency = monthPaid.reduce<Record<string, number>>((acc, row) => {
      acc[row.currency] = (acc[row.currency] || 0) + row.amount;
      return acc;
    }, {});

    return {
      todaysPayments: todayPayments,
      monthlyRevenue: monthRevenueAgg._sum.amount || 0,
      monthlyRevenueByCurrency: revenueByCurrency,
      totalRegistrations,
      recentPayments,
      latestRegistrations,
    };
  }
}
