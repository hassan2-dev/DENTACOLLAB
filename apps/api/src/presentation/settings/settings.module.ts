import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  Injectable,
  Module,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { AuditService } from '../../infrastructure/audit/audit.module';

class UpsertSettingsDto {
  @ApiProperty()
  @IsObject()
  settings!: Record<string, unknown>;
}

const SENSITIVE_KEYS = new Set(['stripe', 'resend', 'r2', 'openai']);

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(includeSensitive = false) {
    const rows = await this.prisma.setting.findMany();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      if (!includeSensitive && SENSITIVE_KEYS.has(row.key)) {
        const value = (row.value || {}) as Record<string, unknown>;
        const redacted: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          if (typeof v === 'string' && v.length > 0) {
            redacted[k] = '********';
            redacted[`${k}Configured`] = true;
          } else {
            redacted[k] = v;
            redacted[`${k}Configured`] = false;
          }
        }
        result[row.key] = redacted;
      } else {
        result[row.key] = row.value;
      }
    }
    return result;
  }

  async upsertMany(settings: Record<string, unknown>) {
    for (const [key, value] of Object.entries(settings)) {
      const existing = await this.prisma.setting.findUnique({ where: { key } });
      let nextValue = value as Record<string, unknown>;

      // Keep previous secrets when client sends masked ********
      if (existing && SENSITIVE_KEYS.has(key) && value && typeof value === 'object') {
        const prev = (existing.value || {}) as Record<string, unknown>;
        nextValue = { ...prev };
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (typeof v === 'string' && v.includes('****')) continue;
          if (k.endsWith('Configured')) continue;
          nextValue[k] = v;
        }
      }

      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value: nextValue as object },
        update: { value: nextValue as object },
      });
    }
    return this.getAll(true);
  }
}

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(
    private readonly service: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Public()
  @Get()
  getPublic() {
    return this.service.getAll(false);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('admin')
  getAdmin() {
    return this.service.getAll(true);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put()
  async upsert(
    @Body() dto: UpsertSettingsDto,
    @Body() _raw: UpsertSettingsDto,
  ) {
    const result = await this.service.upsertMany(dto.settings);
    await this.audit.log({
      userName: 'Admin',
      action: 'Updated Settings',
      entity: 'Setting',
      details: Object.keys(dto.settings).join(', '),
    });
    return result;
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
