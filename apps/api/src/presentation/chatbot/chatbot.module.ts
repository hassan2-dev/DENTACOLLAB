import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';

export type ChatBotSettingsValue = {
  welcomeAr: string;
  welcomeEn: string;
  goodbyeAr: string;
  goodbyeEn: string;
  outOfScopeAr: string;
  outOfScopeEn: string;
};

export const DEFAULT_CHATBOT_SETTINGS: ChatBotSettingsValue = {
  welcomeAr: 'مرحباً بك في DentaCollab. كيف أقدر أساعدك بخصوص الدورات أو التسجيل؟',
  welcomeEn: 'Welcome to DentaCollab. How can I help with courses or registration?',
  goodbyeAr: 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!',
  goodbyeEn: 'Thanks for chatting with us. Have a great day!',
  outOfScopeAr:
    'عذراً، هذا السؤال خارج نطاق الأسئلة المتوفرة. يمكنك التواصل مع الدعم عبر واتساب.',
  outOfScopeEn:
    'Sorry, that question is outside our FAQ. You can reach support on WhatsApp.',
};

const MATCH_THRESHOLD = 0.42;

class UpsertQaDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  questionAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  answerAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  questionEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  answerEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ChatBotSettingsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  welcomeAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  welcomeEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  goodbyeAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  goodbyeEn!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  outOfScopeAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  outOfScopeEn!: string;
}

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(input: string) {
  return normalizeText(input)
    .split(' ')
    .filter((t) => t.length > 1);
}

function scoreMatch(query: string, candidate: string) {
  const q = normalizeText(query);
  const c = normalizeText(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.92;

  const qTokens = new Set(tokenize(q));
  const cTokens = tokenize(c);
  if (!qTokens.size || !cTokens.length) return 0;

  let overlap = 0;
  for (const token of cTokens) {
    if (qTokens.has(token)) overlap += 1;
  }
  const union = new Set([...qTokens, ...cTokens]).size;
  const jaccard = overlap / union;
  const coverage = overlap / qTokens.size;
  return Math.max(jaccard, coverage * 0.85);
}

function cell(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const found = Object.entries(row).find(([k]) => k.trim().toLowerCase() === key.toLowerCase());
    if (found && found[1] != null && String(found[1]).trim()) return String(found[1]).trim();
  }
  return '';
}

@Injectable()
export class ChatBotService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<ChatBotSettingsValue> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'chatbot' } });
    if (!row?.value || typeof row.value !== 'object') return { ...DEFAULT_CHATBOT_SETTINGS };
    return { ...DEFAULT_CHATBOT_SETTINGS, ...(row.value as Partial<ChatBotSettingsValue>) };
  }

  async updateSettings(dto: ChatBotSettingsDto) {
    const value = {
      welcomeAr: dto.welcomeAr,
      welcomeEn: dto.welcomeEn,
      goodbyeAr: dto.goodbyeAr,
      goodbyeEn: dto.goodbyeEn,
      outOfScopeAr: dto.outOfScopeAr,
      outOfScopeEn: dto.outOfScopeEn,
    };
    await this.prisma.setting.upsert({
      where: { key: 'chatbot' },
      create: { key: 'chatbot', value },
      update: { value },
    });
    return this.getSettings();
  }

  async bootstrap(locale: 'ar' | 'en' = 'ar') {
    const settings = await this.getSettings();
    const items = await this.prisma.chatBotQa.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 6,
      select: { questionAr: true, questionEn: true },
    });
    return {
      welcome: locale === 'en' ? settings.welcomeEn : settings.welcomeAr,
      goodbye: locale === 'en' ? settings.goodbyeEn : settings.goodbyeAr,
      outOfScope: locale === 'en' ? settings.outOfScopeEn : settings.outOfScopeAr,
      quickPrompts: items.map((i) => (locale === 'en' ? i.questionEn : i.questionAr)),
    };
  }

  async listQa() {
    return this.prisma.chatBotQa.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createQa(dto: UpsertQaDto) {
    return this.prisma.chatBotQa.create({
      data: {
        questionAr: dto.questionAr,
        answerAr: dto.answerAr,
        questionEn: dto.questionEn,
        answerEn: dto.answerEn,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateQa(id: string, dto: Partial<UpsertQaDto>) {
    const existing = await this.prisma.chatBotQa.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('QA not found');
    return this.prisma.chatBotQa.update({
      where: { id },
      data: {
        questionAr: dto.questionAr,
        answerAr: dto.answerAr,
        questionEn: dto.questionEn,
        answerEn: dto.answerEn,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async removeQa(id: string) {
    const existing = await this.prisma.chatBotQa.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('QA not found');
    await this.prisma.chatBotQa.delete({ where: { id } });
    return { ok: true };
  }

  async importExcel(file: Express.Multer.File) {
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const created: string[] = [];
    let skipped = 0;

    for (const row of rows) {
      const questionAr = cell(row, 'question_ar', 'questionAr', 'سؤال', 'السؤال');
      const answerAr = cell(row, 'answer_ar', 'answerAr', 'جواب', 'الإجابة', 'اجابة');
      const questionEn = cell(row, 'question_en', 'questionEn', 'question');
      const answerEn = cell(row, 'answer_en', 'answerEn', 'answer');
      if (!questionAr || !answerAr || !questionEn || !answerEn) {
        skipped += 1;
        continue;
      }
      const item = await this.prisma.chatBotQa.create({
        data: { questionAr, answerAr, questionEn, answerEn },
      });
      created.push(item.id);
    }

    return { imported: created.length, skipped, ids: created };
  }

  private async whatsappUrl(userMessage: string, locale: 'ar' | 'en') {
    const general = await this.prisma.setting.findUnique({ where: { key: 'general' } });
    const value = (general?.value ?? {}) as { whatsapp?: string };
    const digits = (value.whatsapp || '').replace(/[^\d]/g, '');
    if (!digits) return null;
    const prefix =
      locale === 'en'
        ? 'Hello DentaCollab support, I have a question:\n'
        : 'مرحباً دعم DentaCollab، لدي سؤال:\n';
    return `https://wa.me/${digits}?text=${encodeURIComponent(prefix + userMessage)}`;
  }

  async ask(message: string, locale: 'ar' | 'en' = 'ar') {
    const settings = await this.getSettings();
    const items = await this.prisma.chatBotQa.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    let best: { score: number; answer: string } | null = null;
    for (const item of items) {
      const primaryQ = locale === 'en' ? item.questionEn : item.questionAr;
      const fallbackQ = locale === 'en' ? item.questionAr : item.questionEn;
      const primaryA = locale === 'en' ? item.answerEn : item.answerAr;
      const score = Math.max(scoreMatch(message, primaryQ), scoreMatch(message, fallbackQ) * 0.9);
      if (!best || score > best.score) best = { score, answer: primaryA };
    }

    if (best && best.score >= MATCH_THRESHOLD) {
      return { matched: true as const, answer: best.answer, mode: 'faq' as const };
    }

    const outOfScope = locale === 'en' ? settings.outOfScopeEn : settings.outOfScopeAr;
    const whatsappUrl = await this.whatsappUrl(message, locale);
    return {
      matched: false as const,
      answer: outOfScope,
      whatsappUrl,
      mode: 'whatsapp' as const,
    };
  }
}

@ApiTags('chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatBotController {
  constructor(private readonly service: ChatBotService) {}

  @Public()
  @Get('bootstrap')
  bootstrap(@Query('locale') locale?: string) {
    const lang = locale === 'en' ? 'en' : 'ar';
    return this.service.bootstrap(lang);
  }

  @Public()
  @Get('settings')
  getSettings() {
    return this.service.getSettings();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Put('settings')
  updateSettings(@Body() dto: ChatBotSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('qa')
  listQa() {
    return this.service.listQa();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post('qa')
  createQa(@Body() dto: UpsertQaDto) {
    return this.service.createQa(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('qa/:id')
  updateQa(@Param('id') id: string, @Body() dto: UpsertQaDto) {
    return this.service.updateQa(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Delete('qa/:id')
  removeQa(@Param('id') id: string) {
    return this.service.removeQa(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post('qa/import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Excel file required');
    return this.service.importExcel(file);
  }
}

@Module({
  controllers: [ChatBotController],
  providers: [ChatBotService],
  exports: [ChatBotService],
})
export class ChatBotModule {}
