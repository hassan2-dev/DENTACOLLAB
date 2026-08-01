import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Injectable,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { localizeRecord, resolveLocale } from '../../common/localize';

class GraduateTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

class UpsertGraduateDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseTitle?: string;

  @ApiProperty()
  @IsDateString()
  graduationDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [GraduateTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraduateTranslationDto)
  translations?: GraduateTranslationDto[];
}

const graduateFields = ['fullName', 'courseTitle', 'description'];

@Injectable()
export class GraduatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(admin = false, locale: Locale = Locale.ar) {
    const rows = await this.prisma.graduate.findMany({
      where: admin ? undefined : { isPublished: true },
      include: { course: true, translations: true },
      orderBy: { graduationDate: 'desc' },
    });
    if (admin) return rows;
    return rows.map((row) => localizeRecord(row, locale, graduateFields));
  }

  async byId(id: string, admin = false) {
    const row = await this.prisma.graduate.findUnique({
      where: { id },
      include: { course: true, translations: true },
    });
    if (!row) throw new NotFoundException('Graduate not found');
    return row;
  }

  private async upsertTranslations(graduateId: string, translations?: GraduateTranslationDto[]) {
    if (!translations?.length) return;
    for (const item of translations) {
      const { locale, ...data } = item;
      await this.prisma.graduateTranslation.upsert({
        where: { graduateId_locale: { graduateId, locale } },
        update: data,
        create: { graduateId, locale, ...data },
      });
    }
  }

  async create(dto: UpsertGraduateDto) {
    const { translations, ...data } = dto;
    const row = await this.prisma.graduate.create({
      data: { ...data, graduationDate: new Date(data.graduationDate) },
      include: { course: true, translations: true },
    });
    await this.upsertTranslations(row.id, translations);
    await this.prisma.graduateTranslation.upsert({
      where: { graduateId_locale: { graduateId: row.id, locale: Locale.ar } },
      update: {
        fullName: data.fullName,
        courseTitle: data.courseTitle,
        description: data.description,
      },
      create: {
        graduateId: row.id,
        locale: Locale.ar,
        fullName: data.fullName,
        courseTitle: data.courseTitle,
        description: data.description,
      },
    });
    return this.byId(row.id, true);
  }

  async update(id: string, dto: UpsertGraduateDto) {
    await this.byId(id, true);
    const { translations, ...data } = dto;
    await this.prisma.graduate.update({
      where: { id },
      data: { ...data, graduationDate: new Date(data.graduationDate) },
    });
    await this.upsertTranslations(id, translations);
    await this.prisma.graduateTranslation.upsert({
      where: { graduateId_locale: { graduateId: id, locale: Locale.ar } },
      update: {
        fullName: data.fullName,
        courseTitle: data.courseTitle,
        description: data.description,
      },
      create: {
        graduateId: id,
        locale: Locale.ar,
        fullName: data.fullName,
        courseTitle: data.courseTitle,
        description: data.description,
      },
    });
    return this.byId(id, true);
  }

  async remove(id: string) {
    await this.byId(id, true);
    await this.prisma.graduate.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('graduates')
@Controller('graduates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GraduatesController {
  constructor(private readonly service: GraduatesService) {}

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

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: UpsertGraduateDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertGraduateDto) {
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
  controllers: [GraduatesController],
  providers: [GraduatesService],
})
export class GraduatesModule {}
