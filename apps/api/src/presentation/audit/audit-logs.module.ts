import { Controller, Get, Module, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditService } from '../../infrastructure/audit/audit.module';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AuditLogsController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.audit.list({ q, limit: 150 });
  }
}

@Module({
  controllers: [AuditLogsController],
})
export class AuditLogsModule {}
