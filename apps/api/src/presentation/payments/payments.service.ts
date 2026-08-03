import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiscountType,
  FormFieldType,
  FunnelEventType,
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

  private async addLog(
    paymentId: string,
    status: string,
    event: string,
    payload?: Record<string, unknown>,
  ) {
    await this.prisma.paymentLog.create({
      data: {
        paymentId,
        status,
        event,
        payload: payload ? (payload as object) : undefined,
      },
    });
  }

  private async notify(title: string, body: string, link = '/payments') {
    await this.prisma.notification.create({ data: { title, body, link } });
  }

  private async nextInvoiceNumber() {
    const invoiceSettings = await this.prisma.setting.findUnique({ where: { key: 'invoice' } });
    const prefix =
      ((invoiceSettings?.value as Record<string, string> | null)?.prefix || 'INV').toUpperCase();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dayPrefix = `${prefix}-${y}${m}${d}`;
    const count = await this.prisma.payment.count({
      where: { invoiceNumber: { startsWith: dayPrefix } },
    });
    return `${dayPrefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async nextRegistrationNumber() {
    const now = new Date();
    const y = now.getFullYear();
    const prefix = `REG-${y}`;
    const count = await this.prisma.payment.count({
      where: { registrationNumber: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
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

  applyDiscount(price: number, coupon: { discountType: DiscountType; discountValue: number }) {
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.round((price * Math.min(coupon.discountValue, 100)) / 100);
    } else {
      discountAmount = Math.min(coupon.discountValue, price);
    }
    const amount = Math.max(price - discountAmount, 0);
    return { amount, discountAmount, originalAmount: price };
  }

  async validateCoupon(courseIdOrSlug: string, code: string) {
    const course = await this.resolveCourse(courseIdOrSlug);
    if (!course.couponsEnabled) {
      throw new BadRequestException('Coupons are not enabled for this course');
    }
    if (course.price == null || course.price <= 0) {
      throw new BadRequestException('Course has no price');
    }
    const coupon = await this.prisma.courseCoupon.findFirst({
      where: {
        courseId: course.id,
        code: code.trim().toUpperCase(),
        isActive: true,
      },
    });
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    const priced = this.applyDiscount(course.price, coupon);
    return {
      valid: true,
      code: coupon.code,
      couponId: coupon.id,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      ...priced,
      currency: course.currency,
    };
  }

  private async resolveCouponForCheckout(course: {
    id: string;
    price: number | null;
    couponsEnabled: boolean;
  }, code?: string) {
    if (!code?.trim()) return null;
    if (!course.couponsEnabled) throw new BadRequestException('Coupons are not enabled');
    const validated = await this.validateCoupon(course.id, code);
    return this.prisma.courseCoupon.findUnique({ where: { id: validated.couponId } });
  }

  async trackFunnel(courseIdOrSlug: string, event: FunnelEventType, sessionId?: string) {
    const course = await this.resolveCourse(courseIdOrSlug);
    await this.prisma.courseFunnelEvent.create({
      data: {
        courseId: course.id,
        event,
        sessionId: sessionId?.slice(0, 120) || null,
      },
    });
    return { ok: true };
  }

  async createSession(dto: CreateCheckoutSessionDto) {
    if (!this.stripe.enabled || !this.stripe.client) {
      throw new ServiceUnavailableException('Stripe payments are not configured');
    }

    const course = await this.resolveCourse(dto.courseIdOrSlug);
    if (course.status !== PublishStatus.PUBLISHED || !course.allowRegistration) {
      throw new BadRequestException('Course is not open for registration');
    }
    if (!isRegistrationOpen(course)) {
      throw new BadRequestException('Registration is closed for this course');
    }
    const requiresPayment = course.requiresPayment && course.price != null && course.price > 0;
    if (!requiresPayment) {
      throw new BadRequestException('This course does not require payment checkout');
    }

    const { answers, fullName, phone, email } = await this.validateAnswers(course.id, dto);
    const currency = (course.currency || 'USD').toUpperCase();
    const originalAmount = course.price!;
    const coupon = await this.resolveCouponForCheckout(course, dto.couponCode);
    const priced = coupon
      ? this.applyDiscount(originalAmount, coupon)
      : { amount: originalAmount, discountAmount: 0, originalAmount };

    if (priced.amount <= 0) {
      throw new BadRequestException('Payable amount must be greater than zero');
    }

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
        amount: priced.amount,
        originalAmount: priced.originalAmount,
        discountAmount: priced.discountAmount,
        currency,
        paymentStatus: PaymentStatus.PENDING,
        couponId: coupon?.id,
        couponCode: coupon?.code,
        metadata: { locale },
      },
    });

    await this.addLog(payment.id, PaymentStatus.PENDING, 'CREATED', {
      amount: priced.amount,
      coupon: coupon?.code,
    });
    await this.addLog(payment.id, PaymentStatus.PENDING, 'WAITING_PAYMENT');
    await this.trackFunnel(course.id, FunnelEventType.CHECKOUT_STARTED);

    const successUrl = `${this.webBase()}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.webBase()}/payments/cancel?course=${encodeURIComponent(course.slug)}&payment_id=${payment.id}`;

    try {
      const session = await this.stripe.createCheckoutSession({
        paymentId: payment.id,
        invoiceNumber,
        courseTitle: course.title,
        amount: priced.amount,
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
      await this.addLog(payment.id, PaymentStatus.PENDING, 'CHECKOUT_SESSION_CREATED', {
        sessionId: session.id,
      });

      return {
        paymentId: payment.id,
        invoiceNumber,
        checkoutUrl: session.url,
        sessionId: session.id,
        amount: priced.amount,
        discountAmount: priced.discountAmount,
        currency,
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: PaymentStatus.FAILED },
      });
      await this.addLog(payment.id, PaymentStatus.FAILED, 'CHECKOUT_SESSION_FAILED', {
        message: (error as Error).message,
      });
      await this.notify('Stripe Failed', `Failed to create checkout for ${fullName}`, '/payments');
      this.logger.error('Failed to create Stripe session', error as Error);
      throw new BadRequestException('Unable to create checkout session');
    }
  }

  async retryPayment(paymentId: string) {
    if (!this.stripe.enabled || !this.stripe.client) {
      throw new ServiceUnavailableException('Stripe payments are not configured');
    }
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const retryable: PaymentStatus[] = [
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
      PaymentStatus.PENDING,
    ];
    if (!retryable.includes(payment.paymentStatus)) {
      throw new BadRequestException('Only failed/cancelled/pending payments can be retried');
    }
    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already completed');
    }
    if (!isRegistrationOpen(payment.course) || !payment.course.allowRegistration) {
      throw new BadRequestException('Registration is closed for this course');
    }

    const successUrl = `${this.webBase()}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.webBase()}/payments/cancel?course=${encodeURIComponent(payment.course.slug)}&payment_id=${payment.id}`;

    const session = await this.stripe.createCheckoutSession({
      paymentId: payment.id,
      invoiceNumber: payment.invoiceNumber,
      courseTitle: payment.course.title,
      amount: payment.amount,
      currency: payment.currency,
      customerEmail: payment.email,
      customerName: payment.fullName,
      successUrl,
      cancelUrl,
      metadata: { courseId: payment.courseId, courseSlug: payment.course.slug, retry: '1' },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.PENDING,
        stripeSessionId: session.id,
      },
    });
    await this.addLog(payment.id, PaymentStatus.PENDING, 'RETRY_PAYMENT', { sessionId: session.id });
    await this.addLog(payment.id, PaymentStatus.PENDING, 'WAITING_PAYMENT');

    return {
      paymentId: payment.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async refund(paymentId: string, actorName = 'Admin') {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { course: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid payments can be refunded');
    }
    if (!payment.stripePaymentIntentId) {
      throw new BadRequestException('Missing Stripe payment intent');
    }

    try {
      const refund = await this.stripe.refundPayment({
        paymentIntentId: payment.stripePaymentIntentId,
        amount: payment.amount,
        currency: payment.currency,
      });

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
          stripeRefundId: refund.id,
          refundedAt: new Date(),
        },
        include: {
          course: { select: { id: true, title: true, slug: true } },
          logs: { orderBy: { createdAt: 'asc' } },
        },
      });
      await this.addLog(payment.id, PaymentStatus.REFUNDED, 'REFUNDED', {
        refundId: refund.id,
        by: actorName,
      });
      await this.notify(
        'Payment Refunded',
        `${payment.invoiceNumber} refunded by ${actorName}`,
        `/payments`,
      );
      return updated;
    } catch (error) {
      await this.addLog(payment.id, payment.paymentStatus, 'REFUND_FAILED', {
        message: (error as Error).message,
      });
      throw new BadRequestException(`Refund failed: ${(error as Error).message}`);
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
    const payment = await this.prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
    if (!payment || payment.paymentStatus !== PaymentStatus.PENDING) return;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: PaymentStatus.CANCELLED },
    });
    await this.addLog(payment.id, PaymentStatus.CANCELLED, 'CHECKOUT_EXPIRED');
  }

  private async onPaymentFailed(intent: Stripe.PaymentIntent) {
    const paymentId = intent.metadata?.paymentId;
    if (!paymentId) return;
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.paymentStatus !== PaymentStatus.PENDING) return;
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        stripePaymentIntentId: intent.id,
      },
    });
    await this.addLog(paymentId, PaymentStatus.FAILED, 'PAYMENT_FAILED', { intentId: intent.id });
    await this.notify('Stripe Failed', `Payment failed for ${payment.fullName}`, '/payments');
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

    if (payment.paymentStatus === PaymentStatus.PAID) return;

    if (session.payment_status !== 'paid') {
      this.logger.warn(`Session ${session.id} completed but not paid (${session.payment_status})`);
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const answers = (payment.answers as Record<string, string> | null) || {};
    const registrationNumber = payment.registrationNumber || (await this.nextRegistrationNumber());

    let registrationId = payment.registrationId;
    if (!registrationId) {
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
      registrationId = registration.id;
    }

    if (payment.couponId) {
      await this.prisma.courseCoupon.update({
        where: { id: payment.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    await this.addLog(payment.id, PaymentStatus.PAID, 'PAID', { sessionId: session.id });
    await this.trackFunnel(payment.courseId, FunnelEventType.PAID);

    let invoicePdfUrl: string | null = null;
    let invoicePdfKey: string | null = null;
    let invoiceGeneratedAt: Date | null = null;
    try {
      const uploaded = await this.invoices.generateAndUpload({
        invoiceNumber: payment.invoiceNumber,
        registrationNumber,
        studentName: payment.fullName,
        courseTitle: payment.course.title,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        discountAmount: payment.discountAmount,
        currency: payment.currency,
        paymentDate: new Date(),
        paymentStatus: 'PAID',
        email: payment.email,
        phone: payment.phone,
        verifyUrl: `${this.webBase()}/payments/success?session_id=${session.id}`,
      });
      invoicePdfUrl = uploaded.url;
      invoicePdfKey = uploaded.key;
      invoiceGeneratedAt = new Date();
      await this.addLog(payment.id, PaymentStatus.PAID, 'INVOICE_GENERATED', { url: invoicePdfUrl });
    } catch (error) {
      this.logger.error('Failed to generate invoice PDF', error as Error);
      await this.addLog(payment.id, PaymentStatus.PAID, 'INVOICE_FAILED', {
        message: (error as Error).message,
      });
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        registrationId,
        registrationNumber,
        stripePaymentIntentId: paymentIntentId,
        stripeSessionId: session.id,
        invoicePdfUrl,
        invoicePdfKey,
        invoiceGeneratedAt,
        paidAt: new Date(),
      },
      include: { course: true },
    });

    await this.notify(
      'Payment Received',
      `${payment.fullName} paid ${payment.amount} ${payment.currency} — ${payment.invoiceNumber}`,
      '/payments',
    );

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

    const emailResults = await Promise.allSettled([
      this.email.sendRegistrationConfirmation(emailPayload),
      this.email.sendPaymentConfirmation(emailPayload),
    ]);
    const emailFailed = emailResults.some((r) => r.status === 'rejected');
    if (emailFailed) {
      await this.addLog(payment.id, PaymentStatus.PAID, 'EMAIL_FAILED');
      await this.notify('Email Failed', `Failed sending emails for ${payment.invoiceNumber}`, '/payments');
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { emailSentAt: new Date() },
      });
      await this.addLog(payment.id, PaymentStatus.PAID, 'EMAIL_SENT');
    }

    return updated;
  }

  async markCancelled(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Paid payments cannot be cancelled');
    }
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: PaymentStatus.CANCELLED },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });
    await this.addLog(paymentId, PaymentStatus.CANCELLED, 'CANCELLED_BY_USER');
    return updated;
  }

  private timeline(payment: {
    createdAt: Date;
    paymentStatus: PaymentStatus;
    paidAt?: Date | null;
    invoiceGeneratedAt?: Date | null;
    emailSentAt?: Date | null;
    refundedAt?: Date | null;
    logs?: Array<{ event: string; status: string; createdAt: Date; payload?: unknown }>;
  }) {
    const steps = [
      { key: 'CREATED', label: 'Created', at: payment.createdAt, done: true },
      {
        key: 'WAITING_PAYMENT',
        label: 'Waiting Payment',
        at: payment.createdAt,
        done: true,
      },
      {
        key: 'PAID',
        label: 'Paid',
        at: payment.paidAt,
        done: Boolean(payment.paidAt) || payment.paymentStatus === PaymentStatus.PAID,
      },
      {
        key: 'INVOICE_GENERATED',
        label: 'Invoice Generated',
        at: payment.invoiceGeneratedAt,
        done: Boolean(payment.invoiceGeneratedAt),
      },
      {
        key: 'EMAIL_SENT',
        label: 'Email Sent',
        at: payment.emailSentAt,
        done: Boolean(payment.emailSentAt),
      },
    ];
    if (payment.refundedAt || payment.paymentStatus === PaymentStatus.REFUNDED) {
      steps.push({
        key: 'REFUNDED',
        label: 'Refunded',
        at: payment.refundedAt,
        done: true,
      });
    }
    return { steps, logs: payment.logs || [] };
  }

  async byId(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true, coverUrl: true } },
        registration: true,
        logs: { orderBy: { createdAt: 'asc' } },
        coupon: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { ...payment, timeline: this.timeline(payment) };
  }

  async bySessionId(sessionId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: {
        course: { select: { id: true, title: true, slug: true, coverUrl: true } },
        registration: true,
        logs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { ...payment, timeline: this.timeline(payment) };
  }

  async getInvoice(id: string) {
    const payment = await this.byId(id);
    if (payment.paymentStatus !== PaymentStatus.PAID && payment.paymentStatus !== PaymentStatus.REFUNDED) {
      throw new BadRequestException('Invoice is only available after successful payment');
    }
    if (!payment.invoicePdfUrl) throw new NotFoundException('Invoice PDF not found');
    return {
      invoiceNumber: payment.invoiceNumber,
      registrationNumber: payment.registrationNumber,
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
              { registrationNumber: { contains: q, mode: 'insensitive' } },
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
      { header: 'Registration', key: 'registrationNumber', width: 18 },
      { header: 'Name', key: 'fullName', width: 24 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Course', key: 'course', width: 28 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Provider', key: 'provider', width: 12 },
      { header: 'Paid At', key: 'paidAt', width: 22 },
      { header: 'Created At', key: 'createdAt', width: 22 },
      { header: 'Invoice PDF', key: 'invoicePdfUrl', width: 40 },
    ];
    for (const row of rows) {
      sheet.addRow({
        invoiceNumber: row.invoiceNumber,
        registrationNumber: row.registrationNumber || '',
        fullName: row.fullName,
        phone: row.phone,
        email: row.email,
        course: row.course.title,
        amount: row.amount,
        currency: row.currency,
        status: row.paymentStatus,
        provider: row.provider,
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

  async courseAnalytics(courseId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.courseFunnelEvent.groupBy({
      by: ['event'],
      where: { courseId, createdAt: { gte: since } },
      _count: { _all: true },
    });
    const map = Object.fromEntries(events.map((e) => [e.event, e._count._all])) as Record<string, number>;
    const visits = map.VISIT || 0;
    const registerClicks = map.REGISTER_CLICK || 0;
    const checkoutStarted = map.CHECKOUT_STARTED || 0;
    const paid = map.PAID || 0;
    const conversion = visits > 0 ? Math.round((paid / visits) * 1000) / 10 : 0;
    return { visits, registerClicks, checkoutStarted, paid, conversion, periodDays: 30 };
  }
}
