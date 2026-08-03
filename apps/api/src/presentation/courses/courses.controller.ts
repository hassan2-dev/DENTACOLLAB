import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Locale, PublishStatus, UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  SetCurriculumDto,
  SetGalleryDto,
  UpdateCourseDto,
} from './courses.dto';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth/guards';
import { resolveLocale } from '../../common/localize';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Public()
  @Get()
  listPublic(@Query('locale') locale?: string) {
    return this.courses.list(false, resolveLocale(locale));
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Get('admin/all')
  listAdmin() {
    return this.courses.list(true);
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.courses.bySlug(slug, false, resolveLocale(locale));
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.courses.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courses.remove(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.courses.setStatus(id, PublishStatus.PUBLISHED);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.courses.setStatus(id, PublishStatus.ARCHIVED);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.courses.setStatus(id, PublishStatus.CLOSED);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/close-registration')
  closeRegistration(@Param('id') id: string) {
    return this.courses.setRegistrationClosed(id, true);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Post(':id/open-registration')
  openRegistration(@Param('id') id: string) {
    return this.courses.setRegistrationClosed(id, false);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Put(':id/curriculum')
  curriculum(@Param('id') id: string, @Body() dto: SetCurriculumDto) {
    return this.courses.setCurriculum(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @Put(':id/gallery')
  gallery(@Param('id') id: string, @Body() dto: SetGalleryDto) {
    return this.courses.setGallery(id, dto);
  }
}
