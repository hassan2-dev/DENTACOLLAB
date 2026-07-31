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
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, MediaType, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { localizeRecord, resolveLocale } from '../../common/localize';

class MediaItemDto {
  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional({ enum: MediaType })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

class AlbumTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

class UpsertAlbumDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [MediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media?: MediaItemDto[];

  @ApiPropertyOptional({ type: [AlbumTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlbumTranslationDto)
  translations?: AlbumTranslationDto[];
}

const albumFields = ['title', 'description'];

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(admin = false, locale: Locale = Locale.ar) {
    const rows = await this.prisma.galleryAlbum.findMany({
      where: admin ? undefined : { isPublished: true },
      include: { media: { orderBy: { sortOrder: 'asc' } }, translations: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (admin) return rows;
    return rows.map((row) => localizeRecord(row, locale, albumFields));
  }

  async byId(id: string, admin = false, locale: Locale = Locale.ar) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: 'asc' } }, translations: true },
    });
    if (!album) throw new NotFoundException('Album not found');
    return admin ? album : localizeRecord(album, locale, albumFields);
  }

  private async upsertTranslations(albumId: string, translations?: AlbumTranslationDto[]) {
    if (!translations?.length) return;
    for (const item of translations) {
      const { locale, ...data } = item;
      await this.prisma.galleryAlbumTranslation.upsert({
        where: { albumId_locale: { albumId, locale } },
        update: data,
        create: { albumId, locale, ...data },
      });
    }
  }

  async create(dto: UpsertAlbumDto) {
    const { media, translations, ...data } = dto;
    const album = await this.prisma.galleryAlbum.create({
      data: {
        ...data,
        media: media?.length
          ? {
              create: media.map((m, i) => ({
                url: m.url,
                type: m.type ?? MediaType.IMAGE,
                title: m.title,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { media: true, translations: true },
    });
    await this.upsertTranslations(album.id, translations);
    await this.prisma.galleryAlbumTranslation.upsert({
      where: { albumId_locale: { albumId: album.id, locale: Locale.ar } },
      update: { title: data.title, description: data.description },
      create: { albumId: album.id, locale: Locale.ar, title: data.title, description: data.description },
    });
    return this.byId(album.id, true);
  }

  async update(id: string, dto: UpsertAlbumDto) {
    await this.byId(id, true);
    const { media, translations, ...data } = dto;
    if (media) await this.prisma.galleryMedia.deleteMany({ where: { albumId: id } });
    await this.prisma.galleryAlbum.update({
      where: { id },
      data: {
        ...data,
        media: media
          ? {
              create: media.map((m, i) => ({
                url: m.url,
                type: m.type ?? MediaType.IMAGE,
                title: m.title,
                sortOrder: i,
              })),
            }
          : undefined,
      },
    });
    await this.upsertTranslations(id, translations);
    await this.prisma.galleryAlbumTranslation.upsert({
      where: { albumId_locale: { albumId: id, locale: Locale.ar } },
      update: { title: data.title, description: data.description },
      create: { albumId: id, locale: Locale.ar, title: data.title, description: data.description },
    });
    return this.byId(id, true);
  }

  async remove(id: string) {
    await this.byId(id, true);
    await this.prisma.galleryAlbum.delete({ where: { id } });
    return { success: true };
  }

  async removeMedia(mediaId: string) {
    await this.prisma.galleryMedia.delete({ where: { id: mediaId } });
    return { success: true };
  }
}

@ApiTags('gallery')
@Controller('gallery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GalleryController {
  constructor(private readonly service: GalleryService) {}

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
  create(@Body() dto: UpsertAlbumDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertAlbumDto) {
    return this.service.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Delete('media/:mediaId')
  removeMedia(@Param('mediaId') mediaId: string) {
    return this.service.removeMedia(mediaId);
  }
}

@Module({
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
