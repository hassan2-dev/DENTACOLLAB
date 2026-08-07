import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, FunnelEventType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCheckoutSessionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  courseIdOrSlug!: string;

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
  @IsObject()
  answers?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'ar | en' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  courseIdOrSlug!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  code!: string;
}

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  code!: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  discountValue!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TrackFunnelDto {
  @ApiProperty()
  @IsString()
  courseIdOrSlug!: string;

  @ApiProperty({ enum: FunnelEventType })
  @IsEnum(FunnelEventType)
  event!: FunnelEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class MarkPaidManuallyDto {
  @ApiProperty({ description: 'Name of the person who received the cash/manual payment' })
  @IsString()
  @MinLength(2)
  recipientName!: string;
}
