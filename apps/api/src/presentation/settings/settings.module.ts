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

class UpsertSettingsDto {
  @ApiProperty()
  @IsObject()
  settings!: Record<string, unknown>;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsertMany(settings: Record<string, unknown>) {
    for (const [key, value] of Object.entries(settings)) {
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value: value as object },
        update: { value: value as object },
      });
    }
    return this.getAll();
  }
}

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Public()
  @Get()
  getAll() {
    return this.service.getAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put()
  upsert(@Body() dto: UpsertSettingsDto) {
    return this.service.upsertMany(dto.settings);
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
