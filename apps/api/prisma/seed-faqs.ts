import { PrismaClient } from '@prisma/client';

const faqSeeds = [
  {
    sortOrder: 0,
    categoryAr: 'عام',
    categoryEn: 'General',
    questionAr: 'ما هي DentaCollab؟',
    answerAr:
      'DentaCollab أكاديمية عراقية متخصصة في طب الأسنان الرقمي، تقدّم تدريباً عملياً على برامج مثل Exoplan وExocad مع بيئة تدريبية جاهزة ومتابعة بعد الكورس.',
    questionEn: 'What is DentaCollab?',
    answerEn:
      'DentaCollab is an Iraqi academy specialized in digital dentistry. We offer hands-on training on tools like Exoplan and Exocad, with a ready training environment and post-course follow-up.',
  },
  {
    sortOrder: 1,
    categoryAr: 'التسجيل',
    categoryEn: 'Registration',
    questionAr: 'كيف أسجل في دورة؟',
    answerAr:
      'افتح صفحة الدورة، املأ استمارة التسجيل، وسيتوصل معك فريقنا لتأكيد المقعد وتفاصيل الحضور.',
    questionEn: 'How do I register for a course?',
    answerEn:
      'Open the course page, fill in the registration form, and our team will contact you to confirm your seat and attendance details.',
  },
  {
    sortOrder: 2,
    categoryAr: 'الدورات',
    categoryEn: 'Courses',
    questionAr: 'هل أحتاج حاسوبي وبرامج خاصة؟',
    answerAr:
      'لا. الأكاديمية توفر الأجهزة والبرامج وحساب Exocad الرسمي المعتمد أثناء التدريب. أنت فقط تسجّل وتحضر.',
    questionEn: 'Do I need my own computer and software?',
    answerEn:
      'No. The academy provides the devices, software, and an official certified Exocad account during training. You only need to register and attend.',
  },
  {
    sortOrder: 3,
    categoryAr: 'الشهادات',
    categoryEn: 'Certificates',
    questionAr: 'هل أحصل على شهادة؟',
    answerAr:
      'نعم. بعد إتمام الدورة تحصل على شهادة مشاركة (غير معتمدة).',
    questionEn: 'Will I receive a certificate?',
    answerEn:
      'Yes. After completing the course you receive a participation certificate (not accredited).',
  },
];

export async function seedFaqs(prisma: PrismaClient) {
  // Keep exactly these 4 FAQs as the published set
  await prisma.faqTranslation.deleteMany();
  await prisma.faq.deleteMany();

  for (const item of faqSeeds) {
    const row = await prisma.faq.create({
      data: {
        question: item.questionAr,
        answer: item.answerAr,
        category: item.categoryAr,
        sortOrder: item.sortOrder,
        isPublished: true,
        translations: {
          create: {
            locale: 'en',
            question: item.questionEn,
            answer: item.answerEn,
            category: item.categoryEn,
          },
        },
      },
    });
    // Also store Arabic explicitly in translations for bilingual admin/web
    await prisma.faqTranslation.upsert({
      where: { faqId_locale: { faqId: row.id, locale: 'ar' } },
      update: {
        question: item.questionAr,
        answer: item.answerAr,
        category: item.categoryAr,
      },
      create: {
        faqId: row.id,
        locale: 'ar',
        question: item.questionAr,
        answer: item.answerAr,
        category: item.categoryAr,
      },
    });
  }

  return { count: faqSeeds.length };
}
