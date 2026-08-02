import { PrismaClient } from '@prisma/client';

type GraduateSeed = {
  fullName: string;
  courseSlug: string;
  courseTitle: string;
  description: string;
  imageUrl: string;
  rating: number;
  graduationDate: string;
  featured?: boolean;
  en: { fullName: string; courseTitle: string; description: string };
};

type TestimonialSeed = {
  name: string;
  profession: string;
  review: string;
  imageUrl: string;
  rating: number;
  sortOrder: number;
  en: { name: string; profession: string; review: string };
};

const graduateSeeds: GraduateSeed[] = [
  {
    fullName: 'د. لينا حسن',
    courseSlug: 'exoplan-graduates-basic',
    courseTitle: 'كورس Exoplan للخريجين (المستوى الأساسي)',
    description: 'أنهت البرنامج بتميّز في تخطيط الزرعات وتصميم الأدلة الجراحية.',
    imageUrl: '',
    rating: 5,
    graduationDate: '2026-03-12',
    featured: true,
    en: {
      fullName: 'Dr. Lina Hassan',
      courseTitle: 'Exoplan Course for Graduates (Basic Level)',
      description: 'Completed the program with excellence in implant planning and surgical guide design.',
    },
  },
  {
    fullName: 'د. يوسف راضي',
    courseSlug: 'exoplan-professional-advanced',
    courseTitle: 'كورس الاكسوبلان الاحترافي (المتقدم)',
    description: 'تطبيق عملي قوي على حالات All-on-4 والأدلة متعددة الطبقات.',
    imageUrl: '',
    rating: 5,
    graduationDate: '2026-04-20',
    featured: true,
    en: {
      fullName: 'Dr. Yousef Radhi',
      courseTitle: 'Professional Exoplan Course (Advanced)',
      description: 'Strong practical application on All-on-4 and multi-layered guides.',
    },
  },
  {
    fullName: 'د. مريم الكعبي',
    courseSlug: 'exoplan-graduates-basic',
    courseTitle: 'كورس Exoplan للخريجين (المستوى الأساسي)',
    description: 'انتقلت من الصفر إلى تخطيط حالات حقيقية بثقة خلال يومين.',
    imageUrl: '',
    rating: 5,
    graduationDate: '2026-05-08',
    featured: true,
    en: {
      fullName: 'Dr. Maryam Al-Kaabi',
      courseTitle: 'Exoplan Course for Graduates (Basic Level)',
      description: 'Went from zero to confidently planning real cases in two days.',
    },
  },
  {
    fullName: 'د. علي الجبوري',
    courseSlug: 'exoplan-professional-advanced',
    courseTitle: 'كورس الاكسوبلان الاحترافي (المتقدم)',
    description: 'أتقن مطابقة CBCT مع STL وتصميم أدلة Full-Arch.',
    imageUrl: '',
    rating: 5,
    graduationDate: '2026-05-22',
    featured: false,
    en: {
      fullName: 'Dr. Ali Al-Jubouri',
      courseTitle: 'Professional Exoplan Course (Advanced)',
      description: 'Mastered CBCT–STL alignment and full-arch guide design.',
    },
  },
  {
    fullName: 'د. نور الساعدي',
    courseSlug: 'exoplan-students-basic',
    courseTitle: 'كورس Exoplan للطلاب (المستوى الأساسي)',
    description: 'أول خطوة احترافية في الزراعة الرقمية أثناء الدراسة.',
    imageUrl: '',
    rating: 5,
    graduationDate: '2026-06-01',
    en: {
      fullName: 'Dr. Noor Al-Saadi',
      courseTitle: 'Exoplan Course for Students (Basic Level)',
      description: 'A strong first step into digital implantology during dental school.',
    },
  },
  {
    fullName: 'د. حسام الشمري',
    courseSlug: 'exoplan-graduates-basic',
    courseTitle: 'كورس Exoplan للخريجين (المستوى الأساسي)',
    description: 'استفاد كثيراً من ورشة الطباعة ثلاثية الأبعاد ومتابعة ما بعد الكورس.',
    imageUrl: '',
    rating: 5,
    graduationDate: '2026-06-18',
    en: {
      fullName: 'Dr. Hussam Al-Shammari',
      courseTitle: 'Exoplan Course for Graduates (Basic Level)',
      description: 'Gained a lot from the 3D printing workshop and post-course follow-up.',
    },
  },
];

const testimonialSeeds: TestimonialSeed[] = [
  {
    name: 'د. أحمد نور',
    profession: 'طبيب أسنان',
    review: 'تجربة رائعة ونقلة نوعية في ممارستي الرقمية. الفريق واضح والمنهج عملي جداً.',
    imageUrl: '',
    rating: 5,
    sortOrder: 0,
    en: {
      name: 'Dr. Ahmed Noor',
      profession: 'Dentist',
      review: 'An outstanding experience that transformed my digital practice. Clear team and very practical curriculum.',
    },
  },
  {
    name: 'د. سارة محمود',
    profession: 'أخصائية زراعة أسنان',
    review: 'المحتوى عملي جداً والتخطيط على Exoplan صار أوضح بعد الدورة. أنصح أي زميل يبدأ بالزراعة الرقمية.',
    imageUrl: '',
    rating: 5,
    sortOrder: 1,
    en: {
      name: 'Dr. Sara Mahmoud',
      profession: 'Implantologist',
      review: 'Very practical content — Exoplan planning became much clearer after the course. Highly recommended.',
    },
  },
  {
    name: 'د. كريم العلي',
    profession: 'جراح فم وفكين',
    review: 'تنظيم ممتاز وتطبيقات سريرية حقيقية تفيد العيادة مباشرة من أول أسبوع.',
    imageUrl: '',
    rating: 5,
    sortOrder: 2,
    en: {
      name: 'Dr. Kareem Al-Ali',
      profession: 'Oral Surgeon',
      review: 'Excellent structure with real clinical applications that help the clinic from week one.',
    },
  },
  {
    name: 'د. زينب العبودي',
    profession: 'طبيبة أسنان',
    review: 'أفضل قرار اتخذته للتخصص الرقمي. الحساب الرسمي والبيئة التدريبية وفّروا عليّ وقتاً كبيراً.',
    imageUrl: '',
    rating: 5,
    sortOrder: 3,
    en: {
      name: 'Dr. Zainab Al-Aboudi',
      profession: 'Dentist',
      review: 'Best decision for my digital specialty. The official account and training setup saved me a lot of time.',
    },
  },
  {
    name: 'د. مصطفى الربيعي',
    profession: 'ممارس زراعة رقمية',
    review: 'من المقدمة حتى الطباعة، كل خطوة مشروحة بوضوح. المتابعة بعد الكورس فرّقت كثير.',
    imageUrl: '',
    rating: 5,
    sortOrder: 4,
    en: {
      name: 'Dr. Mustafa Al-Rubaie',
      profession: 'Digital implant practitioner',
      review: 'From intro to printing, every step was clearly explained. Post-course follow-up made a big difference.',
    },
  },
  {
    name: 'د. هديل فاضل',
    profession: 'خريجة طب أسنان',
    review: 'كنت مترددة بالبداية، بس التدريب العملي خلاني أفهم Exoplan بسرعة وأثق بنفسي.',
    imageUrl: '',
    rating: 5,
    sortOrder: 5,
    en: {
      name: 'Dr. Hadeel Fadhil',
      profession: 'Dental graduate',
      review: 'I was hesitant at first, but the hands-on training helped me learn Exoplan quickly and gain confidence.',
    },
  },
];

export async function seedGraduatesAndTestimonials(prisma: PrismaClient) {
  const courseBySlug = new Map(
    (
      await prisma.course.findMany({
        where: {
          slug: {
            in: [
              'exoplan-graduates-basic',
              'exoplan-students-basic',
              'exoplan-professional-advanced',
            ],
          },
        },
        select: { id: true, slug: true },
      })
    ).map((c) => [c.slug, c.id]),
  );

  for (const item of graduateSeeds) {
    const courseId = courseBySlug.get(item.courseSlug) ?? null;
    const existing = await prisma.graduate.findFirst({ where: { fullName: item.fullName } });
    const row =
      existing ??
      (await prisma.graduate.create({
        data: {
          fullName: item.fullName,
          courseTitle: item.courseTitle,
          description: item.description,
          imageUrl: item.imageUrl || null,
          certificateUrl: item.imageUrl || null,
          courseId,
          rating: item.rating,
          graduationDate: new Date(item.graduationDate),
          isPublished: true,
          featured: item.featured === true,
        },
      }));

    await prisma.graduate.update({
      where: { id: row.id },
      data: {
        courseTitle: item.courseTitle,
        description: item.description,
        imageUrl: item.imageUrl || null,
        certificateUrl: item.imageUrl || null,
        courseId,
        rating: item.rating,
        graduationDate: new Date(item.graduationDate),
        isPublished: true,
        featured: item.featured === true,
      },
    });

    await prisma.graduateTranslation.upsert({
      where: { graduateId_locale: { graduateId: row.id, locale: 'en' } },
      update: item.en,
      create: { graduateId: row.id, locale: 'en', ...item.en },
    });
  }

  for (const item of testimonialSeeds) {
    const existing = await prisma.testimonial.findFirst({ where: { name: item.name } });
    const row =
      existing ??
      (await prisma.testimonial.create({
        data: {
          name: item.name,
          profession: item.profession,
          rating: item.rating,
          review: item.review,
          imageUrl: item.imageUrl || null,
          isPublished: true,
          sortOrder: item.sortOrder,
        },
      }));

    await prisma.testimonial.update({
      where: { id: row.id },
      data: {
        profession: item.profession,
        rating: item.rating,
        review: item.review,
        imageUrl: item.imageUrl || null,
        isPublished: true,
        sortOrder: item.sortOrder,
      },
    });

    await prisma.testimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: row.id, locale: 'en' } },
      update: item.en,
      create: { testimonialId: row.id, locale: 'en', ...item.en },
    });
  }

  return {
    graduates: graduateSeeds.length,
    testimonials: testimonialSeeds.length,
  };
}
