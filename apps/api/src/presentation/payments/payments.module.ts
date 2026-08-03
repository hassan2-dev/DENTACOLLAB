import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentStatus, UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import {
  CreateCheckoutSessionDto,
  CreateCouponDto,
  TrackFunnelDto,
  ValidateCouponDto,
} from './payments.dto';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../infrastructure/audit/audit.module';
import { RegistrationScheduler } from './registration.scheduler';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  private async courseId(courseIdOrSlug: string) {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course.id;
  }

  async list(courseIdOrSlug: string) {
    const courseId = await this.courseId(courseIdOrSlug);
    return this.prisma.courseCoupon.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(courseIdOrSlug: string, dto: CreateCouponDto) {
    const courseId = await this.courseId(courseIdOrSlug);
    return this.prisma.courseCoupon.create({
      data: {
        courseId,
        code: dto.code.trim().toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(courseIdOrSlug: string, couponId: string, dto: CreateCouponDto) {
    const courseId = await this.courseId(courseIdOrSlug);
    const existing = await this.prisma.courseCoupon.findFirst({
      where: { id: couponId, courseId },
    });
    if (!existing) throw new NotFoundException('Coupon not found');
    return this.prisma.courseCoupon.update({
      where: { id: couponId },
      data: {
        code: dto.code.trim().toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit ?? null,
        isActive: dto.isActive ?? existing.isActive,
      },
    });
  }

  async remove(courseIdOrSlug: string, couponId: string) {
    const courseId = await this.courseId(courseIdOrSlug);
    await this.prisma.courseCoupon.deleteMany({ where: { id: couponId, courseId } });
    return { success: true };
  }
}

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly coupons: CouponsService,
    private readonly audit: AuditService,
  ) {}

  @Public()
  @Post('create-session')
  createSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.payments.createSession(dto);
  }

  @Public()
  @Post('validate-coupon')
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.payments.validateCoupon(dto.courseIdOrSlug, dto.code);
  }

  @Public()
  @Post('track')
  @HttpCode(204)
  async track(@Body() dto: TrackFunnelDto) {
    await this.payments.trackFunnel(dto.courseIdOrSlug, dto.event, dto.sessionId);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      return { received: false, error: 'Missing body or signature' };
    }
    return this.payments.handleWebhook(rawBody, signature);
  }

  @Public()
  @Get('session/:sessionId')
  bySession(@Param('sessionId') sessionId: string) {
    return this.payments.bySessionId(sessionId);
  }

  @Public()
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string) {
    return this.payments.markCancelled(id);
  }

  @Public()
  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.payments.retryPayment(id);
  }

  @Public()
  @Get('invoice/:id')
  invoice(@Param('id') id: string) {
    return this.payments.getInvoice(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post(':id/refund')
  async refund(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id?: string; fullName?: string; email?: string } },
  ) {
    const name = req.user?.fullName || req.user?.email || 'Admin';
    const result = await this.payments.refund(id, name);
    await this.audit.log({
      userId: req.user?.id,
      userName: name,
      action: 'Refunded Payment',
      entity: 'Payment',
      entityId: id,
      details: result.invoiceNumber,
    });
    return result;
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('export')
  export(
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.payments.exportExcel(res, { q, status });
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('analytics/course/:courseId')
  courseAnalytics(@Param('courseId') courseId: string) {
    return this.payments.courseAnalytics(courseId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('coupons/:courseId')
  listCoupons(@Param('courseId') courseId: string) {
    return this.coupons.list(courseId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('coupons/:courseId')
  createCoupon(@Param('courseId') courseId: string, @Body() dto: CreateCouponDto) {
    return this.coupons.create(courseId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('coupons/:courseId/:couponId')
  updateCoupon(
    @Param('courseId') courseId: string,
    @Param('couponId') couponId: string,
    @Body() dto: CreateCouponDto,
  ) {
    return this.coupons.update(courseId, couponId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('coupons/:courseId/:couponId')
  removeCoupon(@Param('courseId') courseId: string, @Param('couponId') couponId: string) {
    return this.coupons.remove(courseId, couponId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get()
  list(
    @Query('q') q?: string,
    @Query('status') status?: PaymentStatus,
    @Query('courseId') courseId?: string,
  ) {
    return this.payments.list({ q, status, courseId });
  }

  @Public()
  @Get('public/:id')
  publicById(@Param('id') id: string) {
    return this.payments.byId(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get(':id')
  byId(@Param('id') id: string) {
    return this.payments.byId(id);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, CouponsService, RegistrationScheduler],
  exports: [PaymentsService],
})
export class PaymentsModule {}
