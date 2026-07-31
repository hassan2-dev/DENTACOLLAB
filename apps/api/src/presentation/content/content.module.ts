import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  Injectable,
  Module,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { resolveLocale } from '../../common/localize';

class ContentTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

class UpsertContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [ContentTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentTranslationDto)
  translations?: ContentTranslationDto[];
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locale?: Locale) {
    const rows = await this.prisma.siteContent.findMany({
      include: { translations: true },
      orderBy: { key: 'asc' },
    });
    if (!locale) return rows;
    return rows.map((row) => {
      const translation =
        row.translations.find((item) => item.locale === locale) ??
        row.translations.find((item) => item.locale === Locale.ar);
      return {
        ...row,
        ...(translation
          ? { title: translation.title, body: translation.body, data: translation.data ?? row.data }
          : {}),
        translations: undefined,
      };
    });
  }

  async byKey(key: string, locale: Locale = Locale.ar) {
    const row = await this.prisma.siteContent.findUnique({
      where: { key },
      include: { translations: true },
    });
    if (!row) return null;
    const translation =
      row.translations.find((item) => item.locale === locale) ??
      row.translations.find((item) => item.locale === Locale.ar);
    return {
      ...row,
      ...(translation
        ? { title: translation.title, body: translation.body, data: translation.data ?? row.data }
        : {}),
      translations: undefined,
    };
  }

  async upsert(key: string, dto: UpsertContentDto) {
    const { translations, ...data } = dto;
    const row = await this.prisma.siteContent.upsert({
      where: { key },
      create: {
        key,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        data: data.data as object | undefined,
      },
      update: {
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        data: data.data as object | undefined,
      },
      include: { translations: true },
    });

    await this.prisma.siteContentTranslation.upsert({
      where: { contentId_locale: { contentId: row.id, locale: Locale.ar } },
      update: {
        title: data.title,
        body: data.body,
        data: data.data as object | undefined,
      },
      create: {
        contentId: row.id,
        locale: Locale.ar,
        title: data.title,
        body: data.body,
        data: data.data as object | undefined,
      },
    });

    if (translations?.length) {
      for (const item of translations) {
        const { locale, ...translationData } = item;
        await this.prisma.siteContentTranslation.upsert({
          where: { contentId_locale: { contentId: row.id, locale } },
          update: {
            title: translationData.title,
            body: translationData.body,
            data: translationData.data as object | undefined,
          },
          create: {
            contentId: row.id,
            locale,
            title: translationData.title,
            body: translationData.body,
            data: translationData.data as object | undefined,
          },
        });
      }
    }

    return this.prisma.siteContent.findUnique({
      where: { id: row.id },
      include: { translations: true },
    });
  }
}

@ApiTags('content')
@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.service.list(resolveLocale(locale));
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('admin/all')
  listAdmin() {
    return this.service.list();
  }

  @Public()
  @Get(':key')
  byKey(@Param('key') key: string, @Query('locale') locale?: string) {
    return this.service.byKey(key, resolveLocale(locale));
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Put(':key')
  upsert(@Param('key') key: string, @Body() dto: UpsertContentDto) {
    return this.service.upsert(key, dto);
  }
}

@Module({
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
