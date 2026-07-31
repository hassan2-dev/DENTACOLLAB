import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Injectable,
  Module,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { memoryStorage } from 'multer';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';

class CategoryDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

class EntryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  question!: string;

  @ApiProperty()
  @IsString()
  answer!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}

class UrlDocDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}

function chunkText(text: string, size = 800): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += size) {
    chunks.push(cleaned.slice(i, i + size));
  }
  return chunks;
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

@Injectable()
export class KnowledgeService {
  private openai: OpenAI | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.openai = key ? new OpenAI({ apiKey: key }) : null;
  }

  categories() {
    return this.prisma.knowledgeCategory.findMany({ orderBy: { name: 'asc' } });
  }

  createCategory(dto: CategoryDto) {
    return this.prisma.knowledgeCategory.create({ data: dto });
  }

  entries() {
    return this.prisma.knowledgeEntry.findMany({
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createEntry(dto: EntryDto) {
    const entry = await this.prisma.knowledgeEntry.create({ data: dto });
    await this.indexText(dto.question + '\n' + dto.answer, { entryId: entry.id });
    return entry;
  }

  async updateEntry(id: string, dto: EntryDto) {
    const existing = await this.prisma.knowledgeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Entry not found');
    const entry = await this.prisma.knowledgeEntry.update({ where: { id }, data: dto });
    await this.prisma.knowledgeChunk.deleteMany({ where: { entryId: id } });
    await this.indexText(dto.question + '\n' + dto.answer, { entryId: id });
    return entry;
  }

  async deleteEntry(id: string) {
    await this.prisma.knowledgeEntry.delete({ where: { id } });
    return { success: true };
  }

  documents() {
    return this.prisma.knowledgeDocument.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addUrl(dto: UrlDocDto) {
    let content = dto.url;
    try {
      const res = await fetch(dto.url);
      content = await res.text();
    } catch {
      /* keep url as content fallback */
    }
    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        title: dto.title,
        sourceType: 'URL',
        sourceUrl: dto.url,
        content: content.slice(0, 100_000),
        categoryId: dto.categoryId,
      },
    });
    await this.indexText(content, { documentId: doc.id });
    return doc;
  }

  async uploadDocument(file: Express.Multer.File, title?: string, categoryId?: string) {
    if (!file) throw new BadRequestException('File required');
    const uploaded = await this.storage.upload(file, 'knowledge');
    let content = '';
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.txt') || file.mimetype.startsWith('text/')) {
      content = file.buffer.toString('utf8');
    } else if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      content = result.value;
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const wb = XLSX.read(file.buffer, { type: 'buffer' });
      content = wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n');
    } else if (name.endsWith('.pdf')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const parsed = await pdfParse(file.buffer);
        content = parsed.text;
      } catch {
        content = `PDF uploaded: ${file.originalname}`;
      }
    } else {
      content = file.buffer.toString('utf8');
    }

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        title: title || file.originalname,
        sourceType: 'FILE',
        mediaKey: uploaded.key,
        sourceUrl: uploaded.url,
        content: content.slice(0, 200_000),
        categoryId,
      },
    });
    await this.indexText(content, { documentId: doc.id });
    return doc;
  }

  async deleteDocument(id: string) {
    const doc = await this.prisma.knowledgeDocument.findUnique({ where: { id } });
    if (doc?.mediaKey) await this.storage.remove(doc.mediaKey);
    await this.prisma.knowledgeDocument.delete({ where: { id } });
    return { success: true };
  }

  async reindex() {
    await this.prisma.knowledgeChunk.deleteMany();
    const entries = await this.prisma.knowledgeEntry.findMany();
    for (const e of entries) {
      await this.indexText(`${e.question}\n${e.answer}`, { entryId: e.id });
    }
    const docs = await this.prisma.knowledgeDocument.findMany();
    for (const d of docs) {
      if (d.content) await this.indexText(d.content, { documentId: d.id });
    }
    return { success: true, entries: entries.length, documents: docs.length };
  }

  async search(query: string, topK = 5) {
    const chunks = await this.prisma.knowledgeChunk.findMany();
    if (!chunks.length) return [];
    const qEmb = await this.embed(query);
    return chunks
      .map((c) => ({ ...c, score: cosine(qEmb, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private async indexText(
    text: string,
    ref: { entryId?: string; documentId?: string },
  ) {
    const parts = chunkText(text);
    for (const part of parts) {
      const embedding = await this.embed(part);
      await this.prisma.knowledgeChunk.create({
        data: {
          content: part,
          embedding,
          entryId: ref.entryId,
          documentId: ref.documentId,
        },
      });
    }
  }

  private async embed(text: string): Promise<number[]> {
    if (!this.openai) {
      // Deterministic pseudo-embedding for local/dev without OpenAI
      const dim = 64;
      const out = new Array(dim).fill(0);
      for (let i = 0; i < text.length; i++) {
        out[i % dim] += text.charCodeAt(i) / 255;
      }
      const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
      return out.map((v) => v / norm);
    }
    const res = await this.openai.embeddings.create({
      model: this.config.get('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small',
      input: text.slice(0, 7000),
    });
    return res.data[0].embedding;
  }
}

@ApiTags('knowledge')
@ApiBearerAuth()
@Controller('knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Get('categories')
  categories() {
    return this.service.categories();
  }

  @Post('categories')
  createCategory(@Body() dto: CategoryDto) {
    return this.service.createCategory(dto);
  }

  @Get('entries')
  entries() {
    return this.service.entries();
  }

  @Post('entries')
  createEntry(@Body() dto: EntryDto) {
    return this.service.createEntry(dto);
  }

  @Patch('entries/:id')
  updateEntry(@Param('id') id: string, @Body() dto: EntryDto) {
    return this.service.updateEntry(id, dto);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string) {
    return this.service.deleteEntry(id);
  }

  @Get('documents')
  documents() {
    return this.service.documents();
  }

  @Post('documents/url')
  addUrl(@Body() dto: UrlDocDto) {
    return this.service.addUrl(dto);
  }

  @Post('documents/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        categoryId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('categoryId') categoryId?: string,
  ) {
    return this.service.uploadDocument(file, title, categoryId);
  }

  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string) {
    return this.service.deleteDocument(id);
  }

  @Post('reindex')
  reindex() {
    return this.service.reindex();
  }
}

@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
