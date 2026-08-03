import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class RegistrationScheduler {
  private readonly logger = new Logger(RegistrationScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async closeExpiredRegistrations() {
    const now = new Date();
    const expired = await this.prisma.course.findMany({
      where: {
        closeRegistrationAutomatically: true,
        registrationClosedManually: false,
        registrationEndsAt: { lt: now },
        status: 'PUBLISHED',
      },
      select: { id: true, title: true },
    });

    if (!expired.length) return;

    for (const course of expired) {
      await this.prisma.course.update({
        where: { id: course.id },
        data: { registrationClosedManually: true },
      });
      await this.prisma.notification.create({
        data: {
          title: 'Registration Closed',
          body: `Registration auto-closed for ${course.title}`,
          link: `/courses/${course.id}/edit`,
        },
      });
    }

    this.logger.log(`Auto-closed registration for ${expired.length} course(s)`);
  }
}
