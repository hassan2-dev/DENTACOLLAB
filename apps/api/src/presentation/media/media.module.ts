import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Injectable,
  Module,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { MediaType, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { memoryStorage } from 'multer';

class CreateFolderDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

function detectType(mime: string, name: string): MediaType {
  if (mime.startsWith('image/')) return MediaType.IMAGE;
  if (mime.startsWith('video/')) return MediaType.VIDEO;
  if (mime.includes('pdf') || name.endsWith('.pdf')) return MediaType.PDF;
  if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return MediaType.WORD;
  if (mime.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) return MediaType.EXCEL;
  return MediaType.OTHER;
}

function mediaUrlVariants(url: string, key?: string) {
  const variants = new Set<string>();
  if (url) variants.add(url);
  if (key) {
    variants.add(key);
    variants.add(`/uploads/${key.replace(/^\/+/, '')}`);
    variants.add(key.replace(/^\/+/, ''));
  }
  try {
    const parsed = new URL(url);
    variants.add(parsed.pathname);
    variants.add(parsed.pathname.replace(/^\/+/, ''));
  } catch {
    if (url.startsWith('/')) variants.add(url.slice(1));
  }
  return [...variants].filter(Boolean);
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  folders() {
    return this.prisma.mediaFolder.findMany({ include: { children: true }, orderBy: { name: 'asc' } });
  }

  createFolder(dto: CreateFolderDto) {
    return this.prisma.mediaFolder.create({ data: dto });
  }

  list(params: { q?: string; type?: MediaType; folderId?: string }) {
    return this.prisma.mediaAsset.findMany({
      where: {
        folderId: params.folderId,
        type: params.type,
        name: params.q ? { contains: params.q, mode: 'insensitive' } : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(file: Express.Multer.File, folderId?: string) {
    if (!file) throw new BadRequestException('File required');
    const uploaded = await this.storage.upload(file, 'media');
    return this.prisma.mediaAsset.create({
      data: {
        folderId,
        name: file.originalname,
        key: uploaded.key,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        type: detectType(uploaded.mimeType, file.originalname),
      },
    });
  }

  async findUsages(asset: { url: string; key: string; name: string }) {
    const urls = mediaUrlVariants(asset.url, asset.key);
    const urlIn = { in: urls };

    const [courses, courseGallery, albums, galleryMedia, instructors, testimonials, graduates, workshops, content] =
      await Promise.all([
        this.prisma.course.findMany({ where: { coverUrl: urlIn }, select: { id: true, title: true } }),
        this.prisma.courseGallery.findMany({
          where: { url: urlIn },
          select: { id: true, course: { select: { title: true } } },
        }),
        this.prisma.galleryAlbum.findMany({ where: { coverUrl: urlIn }, select: { id: true, title: true } }),
        this.prisma.galleryMedia.findMany({
          where: { url: urlIn },
          select: { id: true, album: { select: { title: true } } },
        }),
        this.prisma.instructor.findMany({ where: { imageUrl: urlIn }, select: { id: true, name: true } }),
        this.prisma.testimonial.findMany({
          where: { OR: [{ imageUrl: urlIn }, { videoUrl: urlIn }] },
          select: { id: true, name: true },
        }),
        this.prisma.graduate.findMany({
          where: { OR: [{ imageUrl: urlIn }, { certificateUrl: urlIn }] },
          select: { id: true, fullName: true },
        }),
        this.prisma.calendarEvent.findMany({ where: { coverUrl: urlIn }, select: { id: true, title: true } }),
        this.prisma.siteContent.findMany({ where: { imageUrl: urlIn }, select: { id: true, key: true, title: true } }),
      ]);

    const usages: Array<{ type: string; label: string }> = [];
    for (const row of courses) usages.push({ type: 'course_cover', label: `دورة: ${row.title}` });
    for (const row of courseGallery) usages.push({ type: 'course_gallery', label: `معرض دورة: ${row.course.title}` });
    for (const row of albums) usages.push({ type: 'album_cover', label: `غلاف ألبوم: ${row.title}` });
    for (const row of galleryMedia) usages.push({ type: 'album_media', label: `صورة ألبوم: ${row.album.title}` });
    for (const row of instructors) usages.push({ type: 'instructor', label: `محاضر: ${row.name}` });
    for (const row of testimonials) usages.push({ type: 'testimonial', label: `شهادة: ${row.name}` });
    for (const row of graduates) usages.push({ type: 'graduate', label: `خريج: ${row.fullName}` });
    for (const row of workshops) usages.push({ type: 'workshop', label: `ورشة: ${row.title}` });
    for (const row of content) {
      usages.push({ type: 'content', label: `محتوى: ${row.title || row.key}` });
    }
    return usages;
  }

  async remove(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media not found');

    const usages = await this.findUsages(asset);
    if (usages.length) {
      const list = usages.map((u) => u.label).join(' · ');
      throw new ConflictException(
        `لا يمكن حذف الوسائط لأنها مستخدمة في: ${list}. أزل الربط أولاً ثم احذف.`,
      );
    }

    await this.storage.remove(asset.key);
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Get('folders')
  folders() {
    return this.service.folders();
  }

  @Post('folders')
  createFolder(@Body() dto: CreateFolderDto) {
    return this.service.createFolder(dto);
  }

  @Get()
  list(
    @Query('q') q?: string,
    @Query('type') type?: MediaType,
    @Query('folderId') folderId?: string,
  ) {
    return this.service.list({ q, type, folderId });
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folderId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
  ) {
    return this.service.upload(file, folderId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
