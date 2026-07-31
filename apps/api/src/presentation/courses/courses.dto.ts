import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, Locale, PublishStatus } from '@prisma/client';

export class CourseTranslationDto {
  @ApiProperty({ enum: Locale })
  @IsEnum(Locale)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  overview!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  objectives!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  requirements!: string[];

  @ApiProperty()
  @IsString()
  duration!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificate?: string;
}

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  overview!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  objectives!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  requirements!: string[];

  @ApiProperty()
  @IsString()
  duration!: string;

  @ApiProperty({ enum: CourseLevel })
  @IsEnum(CourseLevel)
  level!: CourseLevel;

  @ApiPropertyOptional({ description: 'Course price in the selected currency' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'IQD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificate?: string;

  @ApiPropertyOptional({
    description: 'Per-course Google Form (or external) registration URL',
  })
  @IsOptional()
  @IsString()
  registrationFormUrl?: string;

  @ApiPropertyOptional({ enum: PublishStatus })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  instructorIds?: string[];

  @ApiPropertyOptional({ type: [CourseTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseTranslationDto)
  translations?: CourseTranslationDto[];
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  objectives?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ description: 'Course price in the selected currency' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ example: 'IQD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificate?: string;

  @ApiPropertyOptional({
    description: 'Per-course Google Form (or external) registration URL',
  })
  @IsOptional()
  @IsString()
  registrationFormUrl?: string;

  @ApiPropertyOptional({ enum: PublishStatus })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  instructorIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ type: [CourseTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseTranslationDto)
  translations?: CourseTranslationDto[];
}

export class CurriculumLessonDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  topics?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;
}

export class CurriculumModuleDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  outcomes?: string[];

  @ApiProperty({ type: [CurriculumLessonDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumLessonDto)
  lessons!: CurriculumLessonDto[];
}

export class SetCurriculumDto {
  @ApiProperty({ type: [CurriculumModuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumModuleDto)
  modules!: CurriculumModuleDto[];
}

export class GalleryItemDto {
  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt?: string;
}

export class SetGalleryDto {
  @ApiProperty({ type: [GalleryItemDto] })
  @IsArray()
  items!: GalleryItemDto[];
}
