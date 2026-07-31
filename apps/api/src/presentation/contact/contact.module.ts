import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Injectable,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MessageStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';

class CreateContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  message!: string;
}

class ReplyDto {
  @ApiProperty()
  @IsString()
  reply!: string;
}

class StatusDto {
  @ApiProperty({ enum: MessageStatus })
  @IsEnum(MessageStatus)
  status!: MessageStatus;
}

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    const msg = await this.prisma.contactMessage.create({ data: dto });
    await this.prisma.notification.create({
      data: {
        title: 'رسالة تواصل جديدة',
        body: `${dto.fullName}: ${dto.subject}`,
        link: '/messages',
      },
    });
    return msg;
  }

  list() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, status: MessageStatus) {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Message not found');
    return this.prisma.contactMessage.update({ where: { id }, data: { status } });
  }

  async reply(id: string, reply: string) {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Message not found');
    return this.prisma.contactMessage.update({
      where: { id },
      data: { reply, status: MessageStatus.REPLIED },
    });
  }
}

@ApiTags('contact')
@Controller('contact')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('messages')
  list() {
    return this.service.list();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('messages/:id/status')
  status(@Param('id') id: string, @Body() dto: StatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('messages/:id/reply')
  reply(@Param('id') id: string, @Body() dto: ReplyDto) {
    return this.service.reply(id, dto.reply);
  }
}

@Module({
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
