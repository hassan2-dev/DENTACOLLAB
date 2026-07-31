import { Body, Controller, Post, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Throttle } from '@nestjs/throttler';
import { KnowledgeService } from '../knowledge/knowledge.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { JwtAuthGuard, Public } from '../auth/guards';

class ChatDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

@Injectable()
export class ChatService {
  private openai: OpenAI | null;

  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.openai = key ? new OpenAI({ apiKey: key }) : null;
  }

  async ask(message: string) {
    const hits = await this.knowledge.search(message, 5);
    const context = hits.map((h, i) => `[${i + 1}] ${h.content}`).join('\n\n');
    const system = `أنت مساعد أكاديمية DentaCollab لطب الأسنان الرقمي.
أجب بالعربية باختصار ودقة اعتماداً على قاعدة المعرفة فقط.
إذا لم تجد معلومات كافية، قل ذلك بوضوح.`;

    if (!this.openai) {
      const fallback =
        hits[0]?.content ??
        'لا تتوفر إجابة حالياً في قاعدة المعرفة. يرجى التواصل مع الفريق.';
      return {
        answer: fallback,
        sources: hits.map((h) => ({ id: h.id, score: h.score, excerpt: h.content.slice(0, 160) })),
        mode: 'local-rag',
      };
    }

    const completion = await this.openai.chat.completions.create({
      model: this.config.get('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `السياق:\n${context || 'لا يوجد سياق'}\n\nسؤال الزائر:\n${message}`,
        },
      ],
      temperature: 0.2,
    });

    return {
      answer: completion.choices[0]?.message?.content ?? 'تعذر إنشاء إجابة.',
      sources: hits.map((h) => ({ id: h.id, score: h.score, excerpt: h.content.slice(0, 160) })),
      mode: 'openai-rag',
    };
  }
}

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  ask(@Body() dto: ChatDto) {
    return this.service.ask(dto.message);
  }
}

@Module({
  imports: [KnowledgeModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
