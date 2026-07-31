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
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { resolveLocale } from '../../common/localize';

class FaqTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  question!: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiProperty()
  @IsString()
  category!: string;
}

class UpsertFaqDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  question!: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [FaqTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqTranslationDto)
  translations?: FaqTranslationDto[];
}

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async list(admin = false, locale: Locale = Locale.ar) {
    const rows = await this.prisma.faq.findMany({
      where: admin ? undefined : { isPublished: true },
      include: { translations: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    if (admin) return rows;
    return rows.map((row) => {
      const translation =
        row.translations.find((item) => item.locale === locale) ??
        row.translations.find((item) => item.locale === Locale.ar);
      return { ...row, ...(translation ?? {}), translations: undefined };
    });
  }

  async byId(id: string) {
    const row = await this.prisma.faq.findUnique({ where: { id }, include: { translations: true } });
    if (!row) throw new NotFoundException('FAQ not found');
    return row;
  }

  private async upsertTranslations(faqId: string, translations?: FaqTranslationDto[]) {
    if (!translations?.length) return;
    for (const item of translations) {
      const { locale, ...data } = item;
      await this.prisma.faqTranslation.upsert({
        where: { faqId_locale: { faqId, locale } },
        update: data,
        create: { faqId, locale, ...data },
      });
    }
  }

  async create(dto: UpsertFaqDto) {
    const { translations, ...data } = dto;
    const row = await this.prisma.faq.create({ data, include: { translations: true } });
    await this.upsertTranslations(row.id, translations);
    await this.prisma.faqTranslation.upsert({
      where: { faqId_locale: { faqId: row.id, locale: Locale.ar } },
      update: { question: data.question, answer: data.answer, category: data.category },
      create: {
        faqId: row.id,
        locale: Locale.ar,
        question: data.question,
        answer: data.answer,
        category: data.category,
      },
    });
    return this.byId(row.id);
  }

  async update(id: string, dto: UpsertFaqDto) {
    await this.byId(id);
    const { translations, ...data } = dto;
    await this.prisma.faq.update({ where: { id }, data });
    await this.upsertTranslations(id, translations);
    await this.prisma.faqTranslation.upsert({
      where: { faqId_locale: { faqId: id, locale: Locale.ar } },
      update: { question: data.question, answer: data.answer, category: data.category },
      create: {
        faqId: id,
        locale: Locale.ar,
        question: data.question,
        answer: data.answer,
        category: data.category,
      },
    });
    return this.byId(id);
  }

  async remove(id: string) {
    await this.byId(id);
    await this.prisma.faq.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('faq')
@Controller('faq')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FaqController {
  constructor(private readonly service: FaqService) {}

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
  create(@Body() dto: UpsertFaqDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertFaqDto) {
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
  controllers: [FaqController],
  providers: [FaqService],
})
export class FaqModule {}
