import { Body, Controller, Post, UseGuards, Injectable, Module } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, Public } from '../auth/guards';
import { ChatBotModule, ChatBotService } from '../chatbot/chatbot.module';

class ChatDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiPropertyOptional({ enum: ['ar', 'en'] })
  @IsOptional()
  @IsIn(['ar', 'en'])
  locale?: 'ar' | 'en';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly chatbot: ChatBotService) {}

  ask(message: string, locale: 'ar' | 'en' = 'ar') {
    return this.chatbot.ask(message, locale);
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
    return this.service.ask(dto.message, dto.locale ?? 'ar');
  }
}

@Module({
  imports: [ChatBotModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
