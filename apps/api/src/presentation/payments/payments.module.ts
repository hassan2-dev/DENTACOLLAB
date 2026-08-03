import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Module,
  Param,
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
import { CreateCheckoutSessionDto } from './payments.dto';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post('create-session')
  createSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.payments.createSession(dto);
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
  @Get('invoice/:id')
  invoice(@Param('id') id: string) {
    return this.payments.getInvoice(id);
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
  @Get('stats/summary')
  stats() {
    return this.payments.dashboardStats();
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
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
