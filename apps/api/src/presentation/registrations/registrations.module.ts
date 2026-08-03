import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { FormFieldType, RegistrationStatus, UserRole } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { DEFAULT_COURSE_FORM_FIELDS, slugifyFieldKey } from './form-field.defaults';
import { isRegistrationOpen } from '../../common/registration-window';

class FormOptionDto {
  @ApiProperty()
  @IsString()
  ar!: string;

  @ApiProperty()
  @IsString()
  en!: string;

  @ApiProperty()
  @IsString()
  value!: string;
}

export class UpsertFormFieldDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  labelAr!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  labelEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeholderAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeholderEn?: string;

  @ApiProperty({ enum: FormFieldType })
  @IsEnum(FormFieldType)
  type!: FormFieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ type: [FormOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormOptionDto)
  options?: FormOptionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  width?: string;

  @ApiPropertyOptional()
  @IsOptional()
  sortOrder?: number;
}

export class ReorderFormFieldsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[];
}

export class CreateRegistrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  answers?: Record<string, string>;
}

class UpdateStatusDto {
  @ApiProperty({ enum: RegistrationStatus })
  @IsEnum(RegistrationStatus)
  status!: RegistrationStatus;
}

const CORE_KEYS = ['fullName', 'phone', 'email', 'city', 'occupation', 'experience', 'notes'] as const;

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCourse(courseIdOrSlug: string) {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async ensureDefaultFields(courseId: string) {
    const count = await this.prisma.courseFormField.count({ where: { courseId } });
    if (count > 0) return;
    await this.prisma.courseFormField.createMany({
      data: DEFAULT_COURSE_FORM_FIELDS.map((field) => ({
        courseId,
        key: field.key,
        labelAr: field.labelAr,
        labelEn: field.labelEn,
        placeholderAr: field.placeholderAr,
        placeholderEn: field.placeholderEn,
        type: field.type,
        required: field.required,
        options: field.options ?? [],
        sortOrder: field.sortOrder,
        width: field.width,
      })),
    });
  }

  async listFormFields(courseIdOrSlug: string) {
    const course = await this.resolveCourse(courseIdOrSlug);
    await this.ensureDefaultFields(course.id);
    return this.prisma.courseFormField.findMany({
      where: { courseId: course.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createFormField(courseIdOrSlug: string, dto: UpsertFormFieldDto) {
    const course = await this.resolveCourse(courseIdOrSlug);
    await this.ensureDefaultFields(course.id);
    const key = slugifyFieldKey(dto.key || dto.labelEn || dto.labelAr);
    const existing = await this.prisma.courseFormField.findUnique({
      where: { courseId_key: { courseId: course.id, key } },
    });
    if (existing) throw new BadRequestException('Field key already exists for this course');
    const last = await this.prisma.courseFormField.findFirst({
      where: { courseId: course.id },
      orderBy: { sortOrder: 'desc' },
    });
    return this.prisma.courseFormField.create({
      data: {
        courseId: course.id,
        key,
        labelAr: dto.labelAr.trim(),
        labelEn: dto.labelEn.trim(),
        placeholderAr: dto.placeholderAr?.trim() || null,
        placeholderEn: dto.placeholderEn?.trim() || null,
        type: dto.type,
        required: dto.required ?? true,
        options: (dto.options ?? []) as object[],
        width: dto.width === 'full' ? 'full' : 'half',
        sortOrder: dto.sortOrder ?? (last ? last.sortOrder + 1 : 0),
      },
    });
  }

  async updateFormField(courseIdOrSlug: string, fieldId: string, dto: UpsertFormFieldDto) {
    const course = await this.resolveCourse(courseIdOrSlug);
    const field = await this.prisma.courseFormField.findFirst({
      where: { id: fieldId, courseId: course.id },
    });
    if (!field) throw new NotFoundException('Form field not found');

    let nextKey = field.key;
    if (dto.key && dto.key !== field.key) {
      nextKey = slugifyFieldKey(dto.key);
      const clash = await this.prisma.courseFormField.findUnique({
        where: { courseId_key: { courseId: course.id, key: nextKey } },
      });
      if (clash) throw new BadRequestException('Field key already exists for this course');
    }

    return this.prisma.courseFormField.update({
      where: { id: field.id },
      data: {
        key: nextKey,
        labelAr: dto.labelAr.trim(),
        labelEn: dto.labelEn.trim(),
        placeholderAr: dto.placeholderAr?.trim() || null,
        placeholderEn: dto.placeholderEn?.trim() || null,
        type: dto.type,
        required: dto.required ?? field.required,
        options: (dto.options ?? field.options ?? []) as object[],
        width: dto.width === 'full' ? 'full' : 'half',
        sortOrder: dto.sortOrder ?? field.sortOrder,
      },
    });
  }

  async removeFormField(courseIdOrSlug: string, fieldId: string) {
    const course = await this.resolveCourse(courseIdOrSlug);
    const field = await this.prisma.courseFormField.findFirst({
      where: { id: fieldId, courseId: course.id },
    });
    if (!field) throw new NotFoundException('Form field not found');
    if (['fullName', 'phone', 'email'].includes(field.key)) {
      throw new BadRequestException('Core contact fields cannot be deleted');
    }
    await this.prisma.courseFormField.delete({ where: { id: field.id } });
    return { success: true };
  }

  async reorderFormFields(courseIdOrSlug: string, dto: ReorderFormFieldsDto) {
    const course = await this.resolveCourse(courseIdOrSlug);
    await Promise.all(
      dto.orderedIds.map((id, index) =>
        this.prisma.courseFormField.updateMany({
          where: { id, courseId: course.id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.listFormFields(course.id);
  }

  async resetFormFields(courseIdOrSlug: string) {
    const course = await this.resolveCourse(courseIdOrSlug);
    await this.prisma.courseFormField.deleteMany({ where: { courseId: course.id } });
    await this.ensureDefaultFields(course.id);
    return this.listFormFields(course.id);
  }

  async create(courseIdOrSlug: string, dto: CreateRegistrationDto) {
    const course = await this.resolveCourse(courseIdOrSlug);
    if (course.status !== PublishStatus.PUBLISHED || !isRegistrationOpen(course)) {
      throw new BadRequestException('Registration is closed for this course');
    }
    // Paid courses must go through Stripe checkout — do not create unpaid registrations
    if (course.price != null && course.price > 0) {
      throw new BadRequestException(
        'This course requires payment. Use /payments/create-session instead.',
      );
    }
    const fields = await this.listFormFields(course.id);
    const answers: Record<string, string> = { ...(dto.answers || {}) };

    for (const key of CORE_KEYS) {
      const value = dto[key];
      if (typeof value === 'string' && value.trim() && !answers[key]) {
        answers[key] = value.trim();
      }
    }

    for (const field of fields) {
      const raw = answers[field.key];
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (field.required && !value) {
        throw new BadRequestException(`Missing required field: ${field.key}`);
      }
      if (field.type === FormFieldType.EMAIL && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new BadRequestException(`Invalid email for field: ${field.key}`);
        }
      }
      answers[field.key] = value;
    }

    const fullName = answers.fullName || '';
    const phone = answers.phone || '';
    const email = answers.email || '';
    if (!fullName || !phone || !email) {
      throw new BadRequestException('fullName, phone and email are required');
    }

    const registration = await this.prisma.courseRegistration.create({
      data: {
        courseId: course.id,
        fullName,
        phone,
        email,
        city: answers.city || '',
        occupation: answers.occupation || '',
        experience: answers.experience || '',
        notes: answers.notes || null,
        answers,
      },
      include: { course: true },
    });

    await this.prisma.notification.create({
      data: {
        title: 'تسجيل كورس جديد',
        body: `${fullName} سجّل في ${course.title}`,
        link: `/registrations`,
      },
    });
    return registration;
  }

  list(params: { q?: string; status?: RegistrationStatus; courseId?: string }) {
    return this.prisma.courseRegistration.findMany({
      where: {
        status: params.status,
        courseId: params.courseId,
        OR: params.q
          ? [
              { fullName: { contains: params.q, mode: 'insensitive' } },
              { email: { contains: params.q, mode: 'insensitive' } },
              { phone: { contains: params.q, mode: 'insensitive' } },
              { city: { contains: params.q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: RegistrationStatus) {
    const row = await this.prisma.courseRegistration.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Registration not found');
    return this.prisma.courseRegistration.update({
      where: { id },
      data: { status },
      include: { course: true },
    });
  }

  async exportExcel(res: Response) {
    const rows = await this.list({});
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registrations');
    sheet.columns = [
      { header: 'الاسم', key: 'fullName', width: 24 },
      { header: 'الهاتف', key: 'phone', width: 16 },
      { header: 'البريد', key: 'email', width: 28 },
      { header: 'المدينة', key: 'city', width: 16 },
      { header: 'المهنة', key: 'occupation', width: 20 },
      { header: 'الخبرة', key: 'experience', width: 20 },
      { header: 'إجابات إضافية', key: 'answers', width: 40 },
      { header: 'الكورس', key: 'course', width: 28 },
      { header: 'الحالة', key: 'status', width: 14 },
      { header: 'التاريخ', key: 'createdAt', width: 20 },
    ];
    for (const row of rows) {
      const answers = (row.answers as Record<string, string> | null) || {};
      const extras = Object.entries(answers)
        .filter(([key]) => !CORE_KEYS.includes(key as (typeof CORE_KEYS)[number]))
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
      sheet.addRow({
        fullName: row.fullName,
        phone: row.phone,
        email: row.email,
        city: row.city,
        occupation: row.occupation,
        experience: row.experience,
        answers: extras,
        course: row.course.title,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      });
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=registrations.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }
}

@ApiTags('registrations')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Public()
  @Get('courses/:courseId/form-fields')
  listFields(@Param('courseId') courseId: string) {
    return this.service.listFormFields(courseId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post('courses/:courseId/form-fields')
  createField(@Param('courseId') courseId: string, @Body() dto: UpsertFormFieldDto) {
    return this.service.createFormField(courseId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('courses/:courseId/form-fields/:fieldId')
  updateField(
    @Param('courseId') courseId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpsertFormFieldDto,
  ) {
    return this.service.updateFormField(courseId, fieldId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Delete('courses/:courseId/form-fields/:fieldId')
  removeField(@Param('courseId') courseId: string, @Param('fieldId') fieldId: string) {
    return this.service.removeFormField(courseId, fieldId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Put('courses/:courseId/form-fields/reorder')
  reorder(@Param('courseId') courseId: string, @Body() dto: ReorderFormFieldsDto) {
    return this.service.reorderFormFields(courseId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post('courses/:courseId/form-fields/reset')
  @HttpCode(200)
  reset(@Param('courseId') courseId: string) {
    return this.service.resetFormFields(courseId);
  }

  @Public()
  @Post('courses/:courseId/registrations')
  create(@Param('courseId') courseId: string, @Body() dto: CreateRegistrationDto) {
    return this.service.create(courseId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('registrations')
  list(
    @Query('q') q?: string,
    @Query('status') status?: RegistrationStatus,
    @Query('courseId') courseId?: string,
  ) {
    return this.service.list({ q, status, courseId });
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('registrations/export/excel')
  export(@Res() res: Response) {
    return this.service.exportExcel(res);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch('registrations/:id/status')
  status(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}

@Module({
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
