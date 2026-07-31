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
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { localizeRecord, resolveLocale } from '../../common/localize';

class TestimonialTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  profession!: string;

  @ApiProperty()
  @IsString()
  review!: string;
}

class UpsertTestimonialDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  profession!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty()
  @IsString()
  review!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [TestimonialTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestimonialTranslationDto)
  translations?: TestimonialTranslationDto[];
}

const testimonialFields = ['name', 'profession', 'review'];

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(admin = false, locale: Locale = Locale.ar) {
    const rows = await this.prisma.testimonial.findMany({
      where: admin ? undefined : { isPublished: true },
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (admin) return rows;
    return rows.map((row) => localizeRecord(row, locale, testimonialFields));
  }

  async byId(id: string) {
    const row = await this.prisma.testimonial.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!row) throw new NotFoundException('Testimonial not found');
    return row;
  }

  private async upsertTranslations(testimonialId: string, translations?: TestimonialTranslationDto[]) {
    if (!translations?.length) return;
    for (const item of translations) {
      const { locale, ...data } = item;
      await this.prisma.testimonialTranslation.upsert({
        where: { testimonialId_locale: { testimonialId, locale } },
        update: data,
        create: { testimonialId, locale, ...data },
      });
    }
  }

  async create(dto: UpsertTestimonialDto) {
    const { translations, ...data } = dto;
    const row = await this.prisma.testimonial.create({
      data,
      include: { translations: true },
    });
    await this.upsertTranslations(row.id, translations);
    await this.prisma.testimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: row.id, locale: Locale.ar } },
      update: { name: data.name, profession: data.profession, review: data.review },
      create: {
        testimonialId: row.id,
        locale: Locale.ar,
        name: data.name,
        profession: data.profession,
        review: data.review,
      },
    });
    return this.byId(row.id);
  }

  async update(id: string, dto: UpsertTestimonialDto) {
    await this.byId(id);
    const { translations, ...data } = dto;
    await this.prisma.testimonial.update({ where: { id }, data });
    await this.upsertTranslations(id, translations);
    await this.prisma.testimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: id, locale: Locale.ar } },
      update: { name: data.name, profession: data.profession, review: data.review },
      create: {
        testimonialId: id,
        locale: Locale.ar,
        name: data.name,
        profession: data.profession,
        review: data.review,
      },
    });
    return this.byId(id);
  }

  async remove(id: string) {
    await this.byId(id);
    await this.prisma.testimonial.delete({ where: { id } });
    return { success: true };
  }
}

@ApiTags('testimonials')
@Controller('testimonials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

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
  create(@Body() dto: UpsertTestimonialDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertTestimonialDto) {
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
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
