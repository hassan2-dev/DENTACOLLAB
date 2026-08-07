/**
 * Exoplan Basic (students) + Professional Advance FAQ entries for the chatbot.
 * Safe to re-run: upserts by matching questionAr.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const EXOPLAN_CHATBOT_QAS = [
  // —— Exoplan Basic (Students) ——
  {
    questionAr: 'ما هو كورس Exoplan Basic للطلاب؟',
    answerAr:
      'هو كورس تأسيسي مخصص للطلاب والمبتدئين لتعلم أساسيات برنامج Exoplan، بدءًا من استيراد الملفات وحتى تصميم الدليل الجراحي وتصديره للطباعة ثلاثية الأبعاد.',
    questionEn: 'What is the Exoplan Basic course for students?',
    answerEn:
      'It is a foundational course for students and beginners to learn Exoplan basics—from importing files to designing a surgical guide and exporting it for 3D printing.',
    sortOrder: 40,
  },
  {
    questionAr: 'لمن هذا الكورس؟',
    answerAr:
      'الكورس مخصص لطلاب طب الأسنان والخريجين الجدد وكل من يرغب بتعلم برنامج Exoplan من الصفر.',
    questionEn: 'Who is this course for?',
    answerEn:
      'The course is for dental students, recent graduates, and anyone who wants to learn Exoplan from scratch.',
    sortOrder: 41,
  },
  {
    questionAr: 'هل أحتاج خبرة سابقة؟',
    answerAr: 'لا، الكورس لا يتطلب أي خبرة سابقة، فهو مصمم للمبتدئين.',
    questionEn: 'Do I need prior experience?',
    answerEn: 'No. The course requires no prior experience—it is designed for beginners.',
    sortOrder: 42,
  },
  {
    questionAr: 'ماذا سأتعلم في كورس الطلاب؟',
    answerAr:
      'ستتعلم: مقدمة عن برنامج Exoplan؛ تحميل ومحاذاة ملفات DICOM وSTL؛ تخطيط الزرعات المنفردة؛ تحديد موقع الزرعة وزاويتها والتوازي بينها؛ تصميم الدليل الجراحي باستخدام Guide Creator؛ وتصدير ملفات STL للطباعة ثلاثية الأبعاد.',
    questionEn: 'What will I learn in the student course?',
    answerEn:
      'You will learn: an introduction to Exoplan; loading and aligning DICOM and STL files; single-implant planning; implant position, angulation, and parallelism; surgical guide design with Guide Creator; and exporting STL files for 3D printing.',
    sortOrder: 43,
  },
  {
    questionAr: 'هل يوجد تدريب عملي؟',
    answerAr: 'نعم، يشمل الكورس تطبيقًا عمليًا على البرنامج.',
    questionEn: 'Is there hands-on training?',
    answerEn: 'Yes. The course includes practical hands-on work on the software.',
    sortOrder: 44,
  },
  {
    questionAr: 'كم مدة كورس Exoplan Basic للطلاب؟',
    answerAr: 'يوم تدريبي واحد.',
    questionEn: 'How long is the Exoplan Basic student course?',
    answerEn: 'One training day.',
    sortOrder: 45,
  },
  {
    questionAr: 'كم مدة الكورس؟',
    answerAr:
      'كورس Exoplan Basic للطلاب: يوم تدريبي واحد. الكورس الاحترافي (Advance): 4 أيام.',
    questionEn: 'How long is the course?',
    answerEn:
      'Exoplan Basic (students): one training day. Professional Advance: 4 days.',
    sortOrder: 45,
  },
  {
    questionAr: 'كم سعر الكورس للطلاب؟',
    answerAr: '150 دولار أمريكي.',
    questionEn: 'What is the student course price?',
    answerEn: '150 USD.',
    sortOrder: 46,
  },
  {
    questionAr: 'هل أحصل على شهادة؟',
    answerAr:
      'كورس الطلاب (Basic): شهادة مشاركة لجميع المشاركين. الكورس الاحترافي (Advance): شهادة رسمية معتمدة من شركة exocad.',
    questionEn: 'Will I receive a certificate?',
    answerEn:
      'Student Basic course: a participation certificate for all attendees. Professional Advance: an official certificate accredited by exocad.',
    sortOrder: 47,
  },
  {
    questionAr: 'هل أحصل على شهادة في كورس الطلاب؟',
    answerAr: 'نعم، يحصل جميع المشاركين على شهادة مشاركة.',
    questionEn: 'Do I get a certificate in the student course?',
    answerEn: 'Yes. All participants receive a participation certificate.',
    sortOrder: 47,
  },
  {
    questionAr: 'هل أحتاج جهاز لابتوب؟',
    answerAr: 'لا، الأكاديمية مجهزة بشكل كامل.',
    questionEn: 'Do I need a laptop?',
    answerEn: 'No. The academy is fully equipped.',
    sortOrder: 48,
  },
  {
    questionAr: 'هل سأتعلم تصميم Surgical Guide؟',
    answerAr: 'نعم، ستتعلم تصميم الدليل الجراحي للحالات المنفردة باستخدام Guide Creator.',
    questionEn: 'Will I learn Surgical Guide design?',
    answerEn:
      'Yes. You will learn to design a surgical guide for single cases using Guide Creator.',
    sortOrder: 49,
  },
  {
    questionAr: 'هل سأتعلم الطباعة ثلاثية الأبعاد؟',
    answerAr: 'ستتعلم كيفية تصدير ملفات STL وتجهيزها للطباعة ثلاثية الأبعاد.',
    questionEn: 'Will I learn 3D printing?',
    answerEn: 'You will learn how to export STL files and prepare them for 3D printing.',
    sortOrder: 50,
  },

  // —— Exoplan Professional Advance ——
  {
    questionAr: 'ما هو الكورس الاحترافي؟',
    answerAr:
      'هو مستوى متقدم يركز على تصميم الأدلة الجراحية للحالات المعقدة باستخدام برنامج Exoplan.',
    questionEn: 'What is the professional course?',
    answerEn:
      'It is an advanced level focused on designing surgical guides for complex cases with Exoplan.',
    sortOrder: 51,
  },
  {
    questionAr: 'من يمكنه الالتحاق بالكورس الاحترافي؟',
    answerAr:
      'يشترط إكمال كورس Exoplan Basic أو امتلاك معرفة مكافئة بأساسيات البرنامج.',
    questionEn: 'Who can join the professional course?',
    answerEn:
      'You must complete Exoplan Basic or have equivalent knowledge of the software basics.',
    sortOrder: 52,
  },
  {
    questionAr: 'ماذا سأتعلم في الكورس الاحترافي؟',
    answerAr:
      'ستتعلم: تقييم وقراءة صور CBCT ومطابقتها مع Oral Scanner؛ تصميم Surgical Guide للزرعات المنفردة؛ تصميم Surgical Guide للزرعات المتعددة؛ تصميم حالات All-on-4؛ تصميم حالات All-on-6؛ تصميم Multi-Layered Stackable Guide (الجزء الأول والثاني)؛ وWorkflow الكامل للطباعة ثلاثية الأبعاد.',
    questionEn: 'What will I learn in the professional course?',
    answerEn:
      'You will learn: assessing and reading CBCT and matching it with the oral scanner; surgical guides for single implants; surgical guides for multiple implants; All-on-4 cases; All-on-6 cases; Multi-Layered Stackable Guide (parts 1 and 2); and the full 3D printing workflow.',
    sortOrder: 53,
  },
  {
    questionAr: 'هل يشمل الكورس الاحترافي حالات All-on-4؟',
    answerAr: 'نعم.',
    questionEn: 'Does the professional course include All-on-4 cases?',
    answerEn: 'Yes.',
    sortOrder: 54,
  },
  {
    questionAr: 'هل يشمل الكورس الاحترافي حالات All-on-6؟',
    answerAr: 'نعم.',
    questionEn: 'Does the professional course include All-on-6 cases?',
    answerEn: 'Yes.',
    sortOrder: 55,
  },
  {
    questionAr: 'هل يشمل الكورس الاحترافي Multiple Implants؟',
    answerAr: 'نعم.',
    questionEn: 'Does the professional course include multiple implants?',
    answerEn: 'Yes.',
    sortOrder: 56,
  },
  {
    questionAr: 'هل يشمل الكورس الاحترافي Multi-Layered Stackable Guide؟',
    answerAr: 'نعم، بجزأيه الأول والثاني.',
    questionEn: 'Does the professional course include Multi-Layered Stackable Guide?',
    answerEn: 'Yes—both part one and part two.',
    sortOrder: 57,
  },
  {
    questionAr: 'هل يشمل Workflow للطباعة ثلاثية الأبعاد؟',
    answerAr: 'نعم، يتم شرح جميع خطوات تجهيز الملفات للطباعة.',
    questionEn: 'Does it include the 3D printing workflow?',
    answerEn: 'Yes. All steps for preparing files for printing are covered.',
    sortOrder: 58,
  },
  {
    questionAr: 'كم مدة الكورس الاحترافي؟',
    answerAr: '4 أيام.',
    questionEn: 'How long is the professional course?',
    answerEn: '4 days.',
    sortOrder: 59,
  },
  {
    questionAr: 'كم سعر الكورس الاحترافي؟',
    answerAr: '750 دولار أمريكي.',
    questionEn: 'What is the professional course price?',
    answerEn: '750 USD.',
    sortOrder: 60,
  },
  {
    questionAr: 'هل الشهادة معتمدة في الكورس الاحترافي؟',
    answerAr: 'نعم، شهادة رسمية معتمدة من شركة exocad.',
    questionEn: 'Is the professional course certificate accredited?',
    answerEn: 'Yes. An official certificate accredited by exocad.',
    sortOrder: 61,
  },
  {
    questionAr: 'ما الفرق بين Basic وAdvance؟',
    answerAr:
      'Basic: للمبتدئين، يشرح أساسيات البرنامج وتصميم الحالات البسيطة. Advance: للمتقدمين، يشرح الحالات المعقدة والأدلة الجراحية المتقدمة والطباعة ثلاثية الأبعاد.',
    questionEn: 'What is the difference between Basic and Advance?',
    answerEn:
      'Basic is for beginners and covers software basics and simple cases. Advance is for advanced learners and covers complex cases, advanced surgical guides, and 3D printing.',
    sortOrder: 62,
  },
  {
    questionAr: 'أي كورس أبدأ به؟',
    answerAr: 'إذا كنت مبتدئًا فابدأ بـ Basic، ثم انتقل إلى Advance.',
    questionEn: 'Which course should I start with?',
    answerEn: 'If you are a beginner, start with Basic, then move to Advance.',
    sortOrder: 63,
  },

  // —— Glossary ——
  {
    questionAr: 'ما هي ملفات DICOM؟',
    answerAr: 'هي ملفات الأشعة المقطعية ثلاثية الأبعاد (CBCT) المستخدمة لتخطيط الزرعات.',
    questionEn: 'What are DICOM files?',
    answerEn: 'They are 3D CBCT scan files used for implant planning.',
    sortOrder: 64,
  },
  {
    questionAr: 'ما هي ملفات STL؟',
    answerAr: 'هي ملفات الطبعة الرقمية للأسنان المستخدمة في التصميم الرقمي والطباعة ثلاثية الأبعاد.',
    questionEn: 'What are STL files?',
    answerEn:
      'They are digital dental impression files used in digital design and 3D printing.',
    sortOrder: 65,
  },
  {
    questionAr: 'ما هو Surgical Guide؟',
    answerAr:
      'هو دليل جراحي يساعد الطبيب على وضع الزرعة في المكان والزاوية المخطط لها بدقة.',
    questionEn: 'What is a Surgical Guide?',
    answerEn:
      'A surgical guide that helps the clinician place the implant in the planned position and angulation accurately.',
    sortOrder: 66,
  },
  {
    questionAr: 'ما هو CBCT؟',
    answerAr:
      'هو تصوير مقطعي ثلاثي الأبعاد للفكين والأسنان يُستخدم في تشخيص وتخطيط الزرعات.',
    questionEn: 'What is CBCT?',
    answerEn:
      '3D cone-beam CT imaging of the jaws and teeth used for implant diagnosis and planning.',
    sortOrder: 67,
  },
  {
    questionAr: 'ما هو Oral Scanner؟',
    answerAr: 'هو جهاز يلتقط طبعة رقمية للأسنان بدل الطبعات التقليدية.',
    questionEn: 'What is an Oral Scanner?',
    answerEn:
      'A device that captures a digital impression of the teeth instead of traditional impressions.',
    sortOrder: 68,
  },
];

export async function seedExoplanChatbotQas(client: PrismaClient = prisma) {
  for (const qa of EXOPLAN_CHATBOT_QAS) {
    const existing = await client.chatBotQa.findFirst({
      where: { questionAr: qa.questionAr },
    });
    if (existing) {
      await client.chatBotQa.update({
        where: { id: existing.id },
        data: {
          answerAr: qa.answerAr,
          questionEn: qa.questionEn,
          answerEn: qa.answerEn,
          sortOrder: qa.sortOrder,
          isActive: true,
        },
      });
    } else {
      await client.chatBotQa.create({ data: qa });
    }
  }

  return EXOPLAN_CHATBOT_QAS.length;
}

async function main() {
  const count = await seedExoplanChatbotQas();
  console.log(`Upserted ${count} Exoplan chatbot Q&As`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
