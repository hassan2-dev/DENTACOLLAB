import {
  Body,
  Controller,
  Get,
  HttpCode,
  Injectable,
  Module,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegistrationStatus, UserRole } from '@prisma/client';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';

class TrackVisitDto {
  @IsString()
  @MinLength(8)
  sessionId!: string;

  @IsOptional()
  @IsString()
  path?: string;
}

const REGISTRATION_STATUSES = Object.values(RegistrationStatus);

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function lastSixMonthKeys() {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}

function sixMonthsAgoStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackVisit(input: TrackVisitDto) {
    const sessionId = input.sessionId.trim().slice(0, 120);
    const path = (input.path || '/').trim().slice(0, 240) || '/';
    // One row per session + path per calendar day (no spam / duplicates)
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const recent = await this.prisma.siteVisit.findFirst({
      where: { sessionId, path, createdAt: { gte: dayStart } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) return { ok: true, deduped: true };
    await this.prisma.siteVisit.create({ data: { sessionId, path } });
    return { ok: true, deduped: false };
  }

  async dashboard() {
    const since = sixMonthsAgoStart();
    const [
      courses,
      publishedCourses,
      registrations,
      newRegistrations,
      instructors,
      messagesUnread,
      graduates,
      testimonials,
      faqs,
      media,
      knowledgeEntries,
      siteVisitors,
      sitePageViews,
      registrationsByStatus,
      recentRegistrations,
    ] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.courseRegistration.count(),
      this.prisma.courseRegistration.count({ where: { status: 'NEW' } }),
      this.prisma.instructor.count(),
      this.prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      this.prisma.graduate.count(),
      this.prisma.testimonial.count(),
      this.prisma.faq.count(),
      this.prisma.mediaAsset.count(),
      this.prisma.knowledgeEntry.count(),
      this.prisma.siteVisit.groupBy({ by: ['sessionId'] }).then((rows) => rows.length),
      this.prisma.siteVisit.count(),
      this.prisma.courseRegistration.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.courseRegistration.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const monthCounts = new Map<string, number>();
    for (const row of recentRegistrations) {
      const key = monthKey(row.createdAt);
      monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
    }
    const statusCounts = new Map(registrationsByStatus.map((r) => [r.status, r._count._all]));

    return {
      cards: {
        courses,
        publishedCourses,
        registrations,
        newRegistrations,
        instructors,
        messagesUnread,
        graduates,
        testimonials,
        faqs,
        media,
        knowledgeEntries,
        siteVisitors,
        sitePageViews,
      },
      charts: {
        registrationsByStatus: REGISTRATION_STATUSES.map((status) => ({
          status,
          count: statusCounts.get(status) || 0,
        })),
        registrationsByMonth: lastSixMonthKeys().map((month) => ({
          month,
          count: monthCounts.get(month) || 0,
        })),
      },
    };
  }
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsPublicController {
  constructor(private readonly service: AnalyticsService) {}

  @Public()
  @Post('visit')
  @HttpCode(204)
  async track(@Body() body: TrackVisitDto) {
    await this.service.trackVisit(body);
  }
}

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }
}

@Module({
  controllers: [AnalyticsPublicController, AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
