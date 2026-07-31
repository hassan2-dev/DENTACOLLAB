import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Injectable,
  Module,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';

class UpsertWorkshopDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presenterAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presenterEn?: string;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiProperty()
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

class PartialWorkshopDto implements Partial<UpsertWorkshopDto> {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titleEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() presenterAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() presenterEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allDay?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
}

function localizeWorkshop<
  T extends {
    title: string;
    titleEn?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    location?: string | null;
    locationEn?: string | null;
    presenterAr?: string | null;
    presenterEn?: string | null;
  },
>(row: T, locale?: string) {
  const en = locale === 'en';
  return {
    ...row,
    title: en && row.titleEn ? row.titleEn : row.title,
    description: en && row.descriptionEn ? row.descriptionEn : row.description,
    location: en && row.locationEn ? row.locationEn : row.location,
    presenter: en && row.presenterEn ? row.presenterEn : row.presenterAr,
  };
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private activeWhere() {
    return {
      isPublished: true,
      endsAt: { gte: new Date() },
    };
  }

  listPublic(locale?: string) {
    return this.prisma.calendarEvent
      .findMany({
        where: this.activeWhere(),
        orderBy: { startsAt: 'asc' },
      })
      .then((rows) => rows.map((row) => localizeWorkshop(row, locale)));
  }

  featured(locale?: string) {
    return this.prisma.calendarEvent
      .findFirst({
        where: { ...this.activeWhere(), isFeatured: true },
        orderBy: { startsAt: 'asc' },
      })
      .then((row) => (row ? localizeWorkshop(row, locale) : null));
  }

  async bySlug(slug: string, locale?: string) {
    const row = await this.prisma.calendarEvent.findFirst({
      where: { slug, ...this.activeWhere() },
    });
    if (!row) throw new NotFoundException('Workshop not found');
    return localizeWorkshop(row, locale);
  }

  listAdmin() {
    return this.prisma.calendarEvent.findMany({ orderBy: { startsAt: 'asc' } });
  }

  async create(dto: UpsertWorkshopDto) {
    if (dto.isFeatured === true) {
      await this.prisma.calendarEvent.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    return this.prisma.calendarEvent.create({
      data: {
        title: dto.title.trim(),
        titleEn: dto.titleEn?.trim() || null,
        slug: dto.slug.trim(),
        description: dto.description?.trim() || null,
        descriptionEn: dto.descriptionEn?.trim() || null,
        coverUrl: dto.coverUrl?.trim() || null,
        location: null,
        locationEn: null,
        presenterAr: dto.presenterAr?.trim() || null,
        presenterEn: dto.presenterEn?.trim() || null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        allDay: dto.allDay ?? false,
        isPublished: dto.isPublished ?? false,
        isFeatured: dto.isFeatured ?? false,
      },
    });
  }

  async update(id: string, dto: PartialWorkshopDto) {
    const row = await this.prisma.calendarEvent.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Workshop not found');

    if (dto.isFeatured === true) {
      await this.prisma.calendarEvent.updateMany({
        where: { isFeatured: true, NOT: { id } },
        data: { isFeatured: false },
      });
    }

    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(dto.title != null ? { title: dto.title.trim() } : {}),
        ...(dto.titleEn !== undefined ? { titleEn: dto.titleEn?.trim() || null } : {}),
        ...(dto.slug != null ? { slug: dto.slug.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.descriptionEn !== undefined ? { descriptionEn: dto.descriptionEn?.trim() || null } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl?.trim() || null } : {}),
        ...(dto.presenterAr !== undefined ? { presenterAr: dto.presenterAr?.trim() || null } : {}),
        ...(dto.presenterEn !== undefined ? { presenterEn: dto.presenterEn?.trim() || null } : {}),
        ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
        ...(dto.allDay != null ? { allDay: dto.allDay } : {}),
        ...(dto.isPublished != null ? { isPublished: dto.isPublished } : {}),
        ...(dto.isFeatured != null ? { isFeatured: dto.isFeatured } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.calendarEvent.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('calendar')
@Controller('calendar')
export class CalendarPublicController {
  constructor(private readonly service: CalendarService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.service.listPublic(locale);
  }

  @Public()
  @Get('featured')
  featured(@Query('locale') locale?: string) {
    return this.service.featured(locale);
  }

  @Public()
  @Get('slug/:slug')
  bySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.service.bySlug(slug, locale);
  }
}

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class CalendarAdminController {
  constructor(private readonly service: CalendarService) {}

  @Get('admin/all')
  listAdmin() {
    return this.service.listAdmin();
  }

  @Post()
  create(@Body() dto: UpsertWorkshopDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: PartialWorkshopDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Module({
  controllers: [CalendarPublicController, CalendarAdminController],
  providers: [CalendarService],
})
export class CalendarModule {}
