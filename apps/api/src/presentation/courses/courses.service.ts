import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, PublishStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  CourseTranslationDto,
  CreateCourseDto,
  SetCurriculumDto,
  SetGalleryDto,
  UpdateCourseDto,
} from './courses.dto';
import { DEFAULT_COURSE_FORM_FIELDS } from '../registrations/form-field.defaults';

const courseInclude = {
  gallery: { orderBy: { sortOrder: 'asc' as const } },
  curriculum: {
    orderBy: { sortOrder: 'asc' as const },
    include: { lessons: { orderBy: { sortOrder: 'asc' as const } } },
  },
  instructors: {
    orderBy: { instructor: { sortOrder: 'asc' as const } },
    include: {
      instructor: { include: { socialLinks: true, translations: true } },
    },
  },
  translations: true,
};

function localizeCourse(course: any, locale: Locale) {
  const translation =
    course.translations?.find((item: any) => item.locale === locale) ??
    course.translations?.find((item: any) => item.locale === Locale.ar);
  const instructors = course.instructors?.map((relation: any) => {
    const instructorTranslation =
      relation.instructor.translations?.find((item: any) => item.locale === locale) ??
      relation.instructor.translations?.find((item: any) => item.locale === Locale.ar);
    return {
      ...relation,
      instructor: {
        ...relation.instructor,
        ...(instructorTranslation
          ? {
              name: instructorTranslation.name,
              title: instructorTranslation.title,
              biography: instructorTranslation.biography,
              experience: instructorTranslation.experience,
              certificates: instructorTranslation.certificates,
            }
          : {}),
        translations: undefined,
      },
    };
  });
  return {
    ...course,
    ...(translation
      ? {
          title: translation.title,
          description: translation.description,
          overview: translation.overview,
          objectives: translation.objectives,
          requirements: translation.requirements,
          duration: translation.duration,
          certificate: translation.certificate,
        }
      : {}),
    translations: undefined,
    instructors,
  };
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(admin = false, locale: Locale = Locale.ar) {
    const courses = await this.prisma.course.findMany({
      where: admin ? undefined : { status: PublishStatus.PUBLISHED },
      include: courseInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return admin ? courses : courses.map((course) => localizeCourse(course, locale));
  }

  async bySlug(slug: string, admin = false, locale: Locale = Locale.ar) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: courseInclude,
    });
    if (!course || (!admin && course.status !== PublishStatus.PUBLISHED)) {
      throw new NotFoundException('Course not found');
    }
    return admin ? course : localizeCourse(course, locale);
  }

  async byId(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: courseInclude,
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  private async upsertTranslations(courseId: string, translations?: CourseTranslationDto[]) {
    if (!translations?.length) return;
    for (const item of translations) {
      const { locale, ...data } = item;
      await this.prisma.courseTranslation.upsert({
        where: { courseId_locale: { courseId, locale } },
        update: data,
        create: { courseId, locale, ...data },
      });
    }
  }

  private async syncArabicTranslation(
    courseId: string,
    data: {
      title?: string;
      description?: string;
      overview?: string;
      objectives?: string[];
      requirements?: string[];
      duration?: string;
      certificate?: string | null;
    },
  ) {
    if (!data.title || !data.description || !data.overview || !data.objectives || !data.requirements || !data.duration) {
      return;
    }
    await this.prisma.courseTranslation.upsert({
      where: { courseId_locale: { courseId, locale: Locale.ar } },
      update: {
        title: data.title,
        description: data.description,
        overview: data.overview,
        objectives: data.objectives,
        requirements: data.requirements,
        duration: data.duration,
        certificate: data.certificate,
      },
      create: {
        courseId,
        locale: Locale.ar,
        title: data.title,
        description: data.description,
        overview: data.overview,
        objectives: data.objectives,
        requirements: data.requirements,
        duration: data.duration,
        certificate: data.certificate,
      },
    });
  }

  async create(dto: CreateCourseDto) {
    const { instructorIds, translations, ...data } = dto;
    const course = await this.prisma.course.create({
      data: {
        ...data,
        instructors: instructorIds?.length
          ? { create: instructorIds.map((instructorId) => ({ instructorId })) }
          : undefined,
      },
      include: courseInclude,
    });
    await this.upsertTranslations(course.id, translations);
    await this.syncArabicTranslation(course.id, data);
    await this.prisma.courseFormField.createMany({
      data: DEFAULT_COURSE_FORM_FIELDS.map((field) => ({
        courseId: course.id,
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
    return this.byId(course.id);
  }

  async update(id: string, dto: UpdateCourseDto) {
    const existing = await this.byId(id);
    const { instructorIds, translations, ...data } = dto;
    if (instructorIds) {
      await this.prisma.courseInstructor.deleteMany({ where: { courseId: id } });
    }
    await this.prisma.course.update({
      where: { id },
      data: {
        ...data,
        instructors: instructorIds
          ? { create: instructorIds.map((instructorId) => ({ instructorId })) }
          : undefined,
      },
    });
    await this.upsertTranslations(id, translations);
    await this.syncArabicTranslation(id, {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      overview: data.overview ?? existing.overview,
      objectives: data.objectives ?? existing.objectives,
      requirements: data.requirements ?? existing.requirements,
      duration: data.duration ?? existing.duration,
      certificate: data.certificate ?? existing.certificate,
    });
    return this.byId(id);
  }

  async remove(id: string) {
    await this.byId(id);
    await this.prisma.course.delete({ where: { id } });
    return { success: true };
  }

  async setStatus(id: string, status: PublishStatus) {
    await this.byId(id);
    return this.prisma.course.update({ where: { id }, data: { status }, include: courseInclude });
  }

  async setCurriculum(id: string, dto: SetCurriculumDto) {
    await this.byId(id);
    await this.prisma.curriculumModule.deleteMany({ where: { courseId: id } });
    for (const [i, mod] of dto.modules.entries()) {
      await this.prisma.curriculumModule.create({
        data: {
          courseId: id,
          title: mod.title,
          description: mod.description,
          outcomes: mod.outcomes ?? [],
          sortOrder: i,
          lessons: {
            create: mod.lessons.map((lesson, j) => ({
              title: lesson.title,
              description: lesson.description,
              topics: lesson.topics ?? [],
              format: lesson.format,
              duration: lesson.duration,
              sortOrder: j,
            })),
          },
        },
      });
    }
    return this.byId(id);
  }

  async setGallery(id: string, dto: SetGalleryDto) {
    await this.byId(id);
    await this.prisma.courseGallery.deleteMany({ where: { courseId: id } });
    await this.prisma.courseGallery.createMany({
      data: dto.items.map((item, i) => ({
        courseId: id,
        url: item.url,
        alt: item.alt,
        sortOrder: i,
      })),
    });
    return this.byId(id);
  }
}
