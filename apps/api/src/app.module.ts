import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AuthModule } from './presentation/auth/auth.module';
import { CoursesModule } from './presentation/courses/courses.module';
import { InstructorsModule } from './presentation/instructors/instructors.module';
import { RegistrationsModule } from './presentation/registrations/registrations.module';
import { GalleryModule } from './presentation/gallery/gallery.module';
import { GraduatesModule } from './presentation/graduates/graduates.module';
import { TestimonialsModule } from './presentation/testimonials/testimonials.module';
import { FaqModule } from './presentation/faq/faq.module';
import { ContactModule } from './presentation/contact/contact.module';
import { MediaModule } from './presentation/media/media.module';
import { ContentModule } from './presentation/content/content.module';
import { SettingsModule } from './presentation/settings/settings.module';
import { KnowledgeModule } from './presentation/knowledge/knowledge.module';
import { ChatBotModule } from './presentation/chatbot/chatbot.module';
import { ChatModule } from './presentation/chat/chat.module';
import { AnalyticsModule } from './presentation/analytics/analytics.module';
import { NotificationsModule } from './presentation/notifications/notifications.module';
import { CalendarModule } from './presentation/calendar/calendar.module';
import { HealthController } from './presentation/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    StorageModule,
    AuthModule,
    CoursesModule,
    InstructorsModule,
    RegistrationsModule,
    GalleryModule,
    GraduatesModule,
    TestimonialsModule,
    FaqModule,
    ContactModule,
    MediaModule,
    ContentModule,
    SettingsModule,
    KnowledgeModule,
    ChatBotModule,
    ChatModule,
    AnalyticsModule,
    NotificationsModule,
    CalendarModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
