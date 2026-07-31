import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Injectable, NotFoundException, Module } from '@nestjs/common';
import { Locale, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { localizeRecord, resolveLocale } from '../../common/localize';

class SocialDto {
  @ApiProperty()
  @IsString()
  platform!: string;

  @ApiProperty()
  @IsString()
  url!: string;
}

class InstructorTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  biography!: string;

  @ApiProperty()
  @IsString()
  experience!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  certificates?: string[];
}

export class UpsertInstructorDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  biography!: string;

  @ApiProperty()
  @IsString()
  experience!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  certificates?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [SocialDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialDto)
  socialLinks?: SocialDto[];

  @ApiPropertyOptional({ type: [InstructorTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstructorTranslationDto)
  translations?: InstructorTranslationDto[];
}

const instructorFields = ['name', 'title', 'biography', 'experience', 'certificates'];
const courseFields = ['title', 'description', 'overview', 'objectives', 'requirements', 'duration', 'certificate'];

const instructorInclude = {
  socialLinks: true,
  translations: true,
  courses: {
    include: {
      course: { include: { translations: true } },
    },
  },
} as const;

function mapPublicInstructor(
  row: {
    courses?: Array<{ course: Record<string, unknown> & { status?: string; translations?: unknown[] } }>;
    translations?: Array<{ locale: Locale } & Record<string, unknown>>;
    socialLinks?: unknown[];
    isPublished?: boolean;
    [key: string]: unknown;
  },
  locale: Locale,
) {
  const localized = localizeRecord(row, locale, instructorFields) as Record<string, unknown>;
  const courses = (row.courses ?? [])
    .filter((rel) => rel.course?.status === 'PUBLISHED')
    .map((rel) => {
      const course = localizeRecord(rel.course as Parameters<typeof localizeRecord>[0], locale, courseFields) as Record<
        string,
        unknown
      >;
      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        coverUrl: course.coverUrl,
        level: course.level,
        duration: course.duration,
        price: course.price,
        currency: course.currency,
      };
    });
  return { ...localized, courses };
}

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(admin = false, locale: Locale = Locale.ar) {
    const rows = await this.prisma.instructor.findMany({
      where: admin ? undefined : { isPublished: true },
      include: instructorInclude,
      orderBy: { sortOrder: 'asc' },
    });
    if (admin) return rows;
    return rows.map((row) => mapPublicInstructor(row, locale));
  }

  async byId(id: string, admin = false, locale: Locale = Locale.ar) {
    const row = await this.prisma.instructor.findUnique({
      where: { id },
      include: instructorInclude,
    });
    if (!row) throw new NotFoundException('Instructor not found');
    if (!admin && !row.isPublished) throw new NotFoundException('Instructor not found');
    return admin ? row : mapPublicInstructor(row, locale);
  }

  private async upsertTranslations(instructorId: string, translations?: InstructorTranslationDto[]) {
    if (!translations?.length) return;
    for (const item of translations) {
      const { locale, ...data } = item;
      await this.prisma.instructorTranslation.upsert({
        where: { instructorId_locale: { instructorId, locale } },
        update: { ...data, certificates: data.certificates ?? [] },
        create: { instructorId, locale, ...data, certificates: data.certificates ?? [] },
      });
    }
  }

  async create(dto: UpsertInstructorDto) {
    const { socialLinks, certificates, translations, ...data } = dto;
    const row = await this.prisma.instructor.create({
      data: {
        ...data,
        certificates: certificates ?? [],
        socialLinks: socialLinks?.length ? { create: socialLinks } : undefined,
      },
      include: instructorInclude,
    });
    await this.upsertTranslations(row.id, translations);
    await this.prisma.instructorTranslation.upsert({
      where: { instructorId_locale: { instructorId: row.id, locale: Locale.ar } },
      update: {
        name: data.name,
        title: data.title,
        biography: data.biography,
        experience: data.experience,
        certificates: certificates ?? [],
      },
      create: {
        instructorId: row.id,
        locale: Locale.ar,
        name: data.name,
        title: data.title,
        biography: data.biography,
        experience: data.experience,
        certificates: certificates ?? [],
      },
    });
    return this.byId(row.id, true);
  }

  async update(id: string, dto: UpsertInstructorDto) {
    await this.byId(id, true);
    const { socialLinks, certificates, translations, ...data } = dto;
    if (socialLinks) {
      await this.prisma.instructorSocial.deleteMany({ where: { instructorId: id } });
    }
    await this.prisma.instructor.update({
      where: { id },
      data: {
        ...data,
        certificates: certificates ?? undefined,
        socialLinks: socialLinks ? { create: socialLinks } : undefined,
      },
    });
    await this.upsertTranslations(id, translations);
    await this.prisma.instructorTranslation.upsert({
      where: { instructorId_locale: { instructorId: id, locale: Locale.ar } },
      update: {
        name: data.name,
        title: data.title,
        biography: data.biography,
        experience: data.experience,
        certificates: certificates ?? [],
      },
      create: {
        instructorId: id,
        locale: Locale.ar,
        name: data.name,
        title: data.title,
        biography: data.biography,
        experience: data.experience,
        certificates: certificates ?? [],
      },
    });
    return this.byId(id, true);
  }

  async remove(id: string) {
    await this.byId(id, true);
    await this.prisma.instructor.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('instructors')
@Controller('instructors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstructorsController {
  constructor(private readonly service: InstructorsService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.service.list(false, resolveLocale(locale));
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('admin/all')
  listAdmin() {
    return this.service.list(true);
  }

  @Public()
  @Get(':id')
  byId(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.service.byId(id, false, resolveLocale(locale));
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: UpsertInstructorDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertInstructorDto) {
    return this.service.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Module({
  controllers: [InstructorsController],
  providers: [InstructorsService],
  exports: [InstructorsService],
})
export class InstructorsModule {}
