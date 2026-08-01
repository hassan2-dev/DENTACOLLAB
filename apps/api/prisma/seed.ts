import { PrismaClient, UserRole, CourseLevel, PublishStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { EXOPLAN_COURSE_SLUGS, seedExoplanCourses } from './seed-exoplan-courses';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Admin123!');

  await prisma.user.upsert({
    where: { email: 'admin@dentacollab.com' },
    update: {},
    create: {
      email: 'admin@dentacollab.com',
      fullName: 'Super Admin',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const instructor = await prisma.instructor.upsert({
    where: { id: 'seed-instructor-1' },
    update: {
      name: 'د. عمار العبيدي',
      title: 'المؤسس والرئيس التنفيذي لـ DentaCollab',
      biography:
        'دكتوراه في أشعة الفم والوجه والفكين، مؤسس DentaCollab ورئيس الجمعية العراقية لطب الأسنان الرقمي، ومدرب Exoplan ITC.',
      experience: 'خبير في طب الأسنان الرقمي، الأشعة، وتخطيط الزرعات الرقمي',
      certificates: [
        'Ph.D. Oral & Maxillofacial Radiology',
        'President of Iraqi Digital Dental Society',
        'Exoplan ITC Trainer',
      ],
      imageUrl: '/dr-ammar.png',
      isPublished: true,
      sortOrder: 0,
    },
    create: {
      id: 'seed-instructor-1',
      name: 'د. عمار العبيدي',
      title: 'المؤسس والرئيس التنفيذي لـ DentaCollab',
      biography:
        'دكتوراه في أشعة الفم والوجه والفكين، مؤسس DentaCollab ورئيس الجمعية العراقية لطب الأسنان الرقمي، ومدرب Exoplan ITC.',
      experience: 'خبير في طب الأسنان الرقمي، الأشعة، وتخطيط الزرعات الرقمي',
      certificates: [
        'Ph.D. Oral & Maxillofacial Radiology',
        'President of Iraqi Digital Dental Society',
        'Exoplan ITC Trainer',
      ],
      imageUrl: '/dr-ammar.png',
      sortOrder: 0,
      socialLinks: {
        create: [
          { platform: 'linkedin', url: 'https://linkedin.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
        ],
      },
    },
  });

  const assistantTrainers = [
    {
      id: 'seed-instructor-noor',
      sortOrder: 1,
      imageUrl: '/dr-noor.png',
      ar: {
        name: 'د. نور الهلال',
        title: 'مساعد مدرب',
        biography:
          'طبيبة أسنان متخصصة في طب الأسنان الرقمي، مدربة Exoplan معتمدة في تصميم الأدلة الجراحية المتقدمة، وخبيرة في سير عمل الجراحة الموجّهة ومستخدمة RealGUIDE.',
        experience: 'طب الأسنان الرقمي وتصميم الأدلة الجراحية المتقدمة باستخدام Exoplan',
        certificates: [
          'B.D.S',
          'Digital Dentistry',
          'Certified in Advanced Surgical Guide Design (Exoplan)',
          'Exoplan Trainer',
          'Guided Implant Surgery Workflow',
          'RealGUIDE User',
        ],
      },
      en: {
        name: 'Dr. Noor Al-Hilal',
        title: 'Assistant Trainer',
        biography:
          'Dental professional specializing in digital dentistry, Exoplan trainer certified in advanced surgical guide design, with expertise in guided implant surgery workflow and RealGUIDE.',
        experience: 'Digital dentistry and advanced surgical guide design with Exoplan',
        certificates: [
          'B.D.S',
          'Digital Dentistry',
          'Certified in Advanced Surgical Guide Design (Exoplan)',
          'Exoplan Trainer',
          'Guided Implant Surgery Workflow',
          'RealGUIDE User',
        ],
      },
    },
    {
      id: 'seed-instructor-hawraa',
      sortOrder: 2,
      imageUrl: '/dr-hawraa.png',
      ar: {
        name: 'د. حوراء الحديثي',
        title: 'مساعد مدرب',
        biography:
          'طبيبة أسنان متخصصة في طب الأسنان الرقمي، مدربة Exoplan معتمدة في تصميم الأدلة الجراحية المتقدمة وفي أساسيات تصميم التعويضات عبر Exocad، مع خبرة في سير عمل الجراحة الموجّهة وRealGUIDE.',
        experience: 'طب الأسنان الرقمي، Exoplan، وأساسيات تصميم التعويضات عبر Exocad',
        certificates: [
          'B.D.S',
          'Digital Dentistry',
          'Certified in Advanced Surgical Guide Design (Exoplan)',
          'Certified in Basic Prostheses Design (Exocad)',
          'Exoplan Trainer',
          'Guided Implant Surgery Workflow',
          'RealGUIDE User',
        ],
      },
      en: {
        name: 'Dr. Hawraa Al-Hadethy',
        title: 'Assistant Trainer',
        biography:
          'Dental professional specializing in digital dentistry, Exoplan trainer certified in advanced surgical guide design and basic prostheses design with Exocad, with expertise in guided implant surgery workflow and RealGUIDE.',
        experience: 'Digital dentistry, Exoplan, and basic prostheses design with Exocad',
        certificates: [
          'B.D.S',
          'Digital Dentistry',
          'Certified in Advanced Surgical Guide Design (Exoplan)',
          'Certified in Basic Prostheses Design (Exocad)',
          'Exoplan Trainer',
          'Guided Implant Surgery Workflow',
          'RealGUIDE User',
        ],
      },
    },
  ] as const;

  const assistantInstructorIds: string[] = [];
  for (const assistant of assistantTrainers) {
    const row = await prisma.instructor.upsert({
      where: { id: assistant.id },
      update: {
        ...assistant.ar,
        imageUrl: assistant.imageUrl,
        isPublished: true,
        sortOrder: assistant.sortOrder,
      },
      create: {
        id: assistant.id,
        ...assistant.ar,
        imageUrl: assistant.imageUrl,
        isPublished: true,
        sortOrder: assistant.sortOrder,
      },
    });
    assistantInstructorIds.push(row.id);

    await prisma.instructorTranslation.upsert({
      where: {
        instructorId_locale: { instructorId: row.id, locale: 'ar' },
      },
      update: assistant.ar,
      create: { instructorId: row.id, locale: 'ar', ...assistant.ar },
    });

    await prisma.instructorTranslation.upsert({
      where: {
        instructorId_locale: { instructorId: row.id, locale: 'en' },
      },
      update: assistant.en,
      create: { instructorId: row.id, locale: 'en', ...assistant.en },
    });
  }

  const publishedInstructorIds = [instructor.id, ...assistantInstructorIds];

  await prisma.instructor.updateMany({
    where: { id: { notIn: publishedInstructorIds } },
    data: { isPublished: false },
  });

  const course = await prisma.course.upsert({
    where: { slug: 'digital-dentistry-fundamentals' },
    update: {
      title: 'ماستر كلاس الجراحة الموجّهة لزراعة الأسنان',
      description:
        'برنامج احترافي متقدم يغطي التخطيط الرقمي للزرعات وتصميم الأدلة الجراحية باستخدام CBCT وOral Scanner وExoplan وصولاً إلى الطباعة ثلاثية الأبعاد.',
      overview:
        'رحلة تدريبية متكاملة تبدأ من تفسير صور CBCT وتقييم ملفات المسح الفموي ودمج DICOM مع STL، ثم تنتقل إلى التخطيط الآمن للزرعات وتصميم الأدلة الجراحية للحالات المفردة والمتعددة وAll-on-4 وAll-on-6 والأدلة متعددة الطبقات، وتنتهي ببروتوكولات الطباعة والمعالجة والتعقيم والتحقق السريري.',
      objectives: [
        'تفسير CBCT وتحديد المعالم التشريحية الحرجة للتخطيط الآمن',
        'تقييم ملفات المسح الفموي ودمج DICOM وSTL بدقة',
        'تخطيط موضع واتجاه وعمق الزرعة وفق مبادئ جراحية وتعويضية',
        'تصميم أدلة جراحية للحالات المفردة والمتعددة باستخدام Exoplan',
        'تصميم أدلة All-on-4 وAll-on-6 والأدلة متعددة الطبقات',
        'إعداد الأدلة للطباعة والمعالجة والتعقيم والتحقق السريري',
      ],
      requirements: [
        'طبيب أسنان أو اختصاصي زراعة أسنان أو جراحة فم وفكين',
        'معرفة أساسية بمبادئ زراعة الأسنان',
        'حاسوب مناسب لتطبيقات التخطيط والتصميم ثلاثي الأبعاد',
        'يفضّل توفر ملفات حالات DICOM وSTL للتطبيق العملي',
      ],
      duration: 'ماستر كلاس تدريبي مكثف',
      level: CourseLevel.ADVANCED,
      certificate: 'شهادة إتمام احترافية معتمدة من DentaCollab',
      coverUrl: '/dentacollab-hero.png',
      registrationFormUrl: null,
      status: PublishStatus.ARCHIVED,
    },
    create: {
      title: 'ماستر كلاس الجراحة الموجّهة لزراعة الأسنان',
      slug: 'digital-dentistry-fundamentals',
      coverUrl: '/dentacollab-hero.png',
      description:
        'برنامج احترافي متقدم يغطي التخطيط الرقمي للزرعات وتصميم الأدلة الجراحية باستخدام CBCT وOral Scanner وExoplan وصولاً إلى الطباعة ثلاثية الأبعاد.',
      overview:
        'رحلة تدريبية متكاملة تبدأ من تفسير صور CBCT وتقييم ملفات المسح الفموي ودمج DICOM مع STL، ثم تنتقل إلى التخطيط الآمن للزرعات وتصميم الأدلة الجراحية للحالات المفردة والمتعددة وAll-on-4 وAll-on-6 والأدلة متعددة الطبقات، وتنتهي ببروتوكولات الطباعة والمعالجة والتعقيم والتحقق السريري.',
      objectives: [
        'تفسير CBCT وتحديد المعالم التشريحية الحرجة للتخطيط الآمن',
        'تقييم ملفات المسح الفموي ودمج DICOM وSTL بدقة',
        'تخطيط موضع واتجاه وعمق الزرعة وفق مبادئ جراحية وتعويضية',
        'تصميم أدلة جراحية للحالات المفردة والمتعددة باستخدام Exoplan',
        'تصميم أدلة All-on-4 وAll-on-6 والأدلة متعددة الطبقات',
        'إعداد الأدلة للطباعة والمعالجة والتعقيم والتحقق السريري',
      ],
      requirements: [
        'طبيب أسنان أو اختصاصي زراعة أسنان أو جراحة فم وفكين',
        'معرفة أساسية بمبادئ زراعة الأسنان',
        'حاسوب مناسب لتطبيقات التخطيط والتصميم ثلاثي الأبعاد',
        'يفضّل توفر ملفات حالات DICOM وSTL للتطبيق العملي',
      ],
      duration: 'ماستر كلاس تدريبي مكثف',
      level: CourseLevel.ADVANCED,
      certificate: 'شهادة إتمام احترافية معتمدة من DentaCollab',
      status: PublishStatus.ARCHIVED,
      instructors: { create: [{ instructorId: instructor.id }] },
      gallery: {
        create: [
          {
            url: '/dentacollab-hero.png',
            alt: 'جلسة تدريب',
            sortOrder: 0,
          },
          {
            url: '/dentacollab-hero.png',
            alt: 'عيادة رقمية',
            sortOrder: 1,
          },
          {
            url: '/dentacollab-hero.png',
            alt: 'تخطيط زرعات',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  const galleryCount = await prisma.courseGallery.count({ where: { courseId: course.id } });
  if (galleryCount < 3) {
    await prisma.courseGallery.deleteMany({ where: { courseId: course.id } });
    await prisma.courseGallery.createMany({
      data: [
        {
          courseId: course.id,
          url: '/dentacollab-hero.png',
          alt: 'جلسة تدريب',
          sortOrder: 0,
        },
        {
          courseId: course.id,
          url: '/dentacollab-hero.png',
          alt: 'عيادة رقمية',
          sortOrder: 1,
        },
        {
          courseId: course.id,
          url: '/dentacollab-hero.png',
          alt: 'تخطيط زرعات',
          sortOrder: 2,
        },
      ],
    });
  }

  const guidedSurgeryCurriculum = [
    {
      title: 'قراءة وتفسير CBCT للتخطيط الجراحي',
      description:
        'تأسيس منهج تشخيصي منظم لقراءة الصور الشعاعية ثلاثية الأبعاد وتحويلها إلى قرارات تخطيط آمنة وقابلة للتنفيذ.',
      outcomes: [
        'قراءة CBCT بطريقة منهجية',
        'تحديد المعالم التشريحية ومناطق الخطر',
        'بناء خطة زرع أولية مبنية على المعطيات الشعاعية',
      ],
      lessons: [
        {
          title: 'منهجية قراءة صور CBCT',
          description: 'التنقل بين المقاطع المحورية والإكليلية والسهمية وبناء رؤية ثلاثية الأبعاد للحالة.',
          topics: ['Image orientation', 'MPR navigation', 'Image quality assessment'],
          format: 'نظري + تحليل حالات',
        },
        {
          title: 'التشخيص وتحديد المعالم التشريحية',
          description: 'تمييز القناة السنية السفلية والجيب الفكي والقشور العظمية وتقييم حجم العظم المتاح.',
          topics: ['Mandibular canal', 'Maxillary sinus', 'Cortical bone', 'Bone volume'],
          format: 'تطبيق عملي',
        },
        {
          title: 'المبادئ الأساسية لتخطيط الزرعات',
          description: 'ربط التقييم التشريحي بالخطة الجراحية والتعويضية وتحديد هوامش الأمان.',
          topics: ['Safety margins', 'Implant dimensions', 'Prosthetically driven planning'],
          format: 'Workshop',
        },
      ],
    },
    {
      title: 'مبادئ الماسح الفموي وتجهيز الملفات',
      description:
        'تقييم جودة ملفات المسح الفموي وتحضير البيانات الرقمية الصحيحة قبل بدء التخطيط وتصميم الدليل.',
      outcomes: ['تمييز أخطاء المسح الشائعة', 'تجهيز ملفات STL', 'تحقيق دمج دقيق بين DICOM وSTL'],
      lessons: [
        {
          title: 'تقييم ملفات المسح الفموي',
          description: 'فحص اكتمال السطح ودقة الإطباق والأنسجة الرخوة وقابلية الملف للاستخدام.',
          topics: ['Scan completeness', 'Occlusion', 'Soft tissue capture', 'STL validation'],
          format: 'نظري + عملي',
        },
        {
          title: 'تقنيات المسح الخاصة بتخطيط الزرعات',
          description: 'اختيار استراتيجية المسح المناسبة للحالات الجزئية والكاملة والحالات عديمة الأسنان.',
          topics: ['Scan strategy', 'Edentulous cases', 'Reference anatomy'],
          format: 'تطبيق عملي',
        },
        {
          title: 'دمج ملفات DICOM وSTL',
          description: 'تنفيذ المطابقة الرقمية والتحقق من دقتها قبل اعتماد الخطة.',
          topics: ['Data alignment', 'Surface matching', 'Alignment verification'],
          format: 'Workshop على Exoplan',
        },
      ],
    },
    {
      title: 'أساسيات Exoplan والتخطيط الآمن للزرعات',
      description:
        'إتقان أدوات Exoplan الأساسية لبناء خريطة أمان تشريحية ووضع الزرعات بدقة وفق الخطة التعويضية.',
      outcomes: ['رسم التراكيب التشريحية', 'ضبط اتجاه وعمق الزرعة', 'معايرة sleeve والـ offset بأمان'],
      lessons: [
        {
          title: 'Anatomical Safety Mapping',
          description: 'تحديد مناطق الخطر قبل وضع الزرعة وإنشاء خريطة تشريحية قابلة للمراجعة.',
          topics: ['Mandibular nerve tracing', 'Sinus segmentation', 'Cortical bone assessment'],
          format: 'تطبيق مباشر على Exoplan',
        },
        {
          title: 'الدقة في تحديد موضع الزرعة',
          description: 'ضبط الاتجاه والزاوية والتوازي وربط موضع الزرعة بالترميم النهائي.',
          topics: ['Orientation', 'Angulation', 'Parallelism', 'Cross-arch accuracy'],
          format: 'تخطيط حالات',
        },
        {
          title: 'ثبات الدليل وهوامش الأمان',
          description: 'اختيار Anchor pins وضبط عمق الـ sleeve والـ offset ومسافات الأمان.',
          topics: ['Anchor pins', 'Sleeve depth', 'Offset calibration', 'Safety margins'],
          format: 'Workshop',
        },
      ],
    },
    {
      title: 'تصميم الأدلة الجراحية للحالات المفردة والمتعددة',
      description:
        'تصميم أدلة سنّية ونسجية الدعم تحقق الثبات والوصول الجراحي والدقة المطلوبة في الحالات السريرية المختلفة.',
      outcomes: ['إنشاء دليل لزرعة مفردة', 'تصميم دليل Tissue-supported', 'تقييم سماكة الدليل ونقاط الدعم'],
      lessons: [
        {
          title: 'Single Implant Surgical Guide',
          description: 'تخطيط وتصميم دليل جراحي لزرعة مفردة من استيراد الملفات حتى التصدير.',
          topics: ['Guide support', 'Inspection windows', 'Sleeve selection', 'STL export'],
          format: 'Hands-on كامل',
        },
        {
          title: 'Tissue-Supported Guide للحالات المتعددة',
          description: 'التعامل مع الحالات عديمة الأسنان وتحسين ثبات الدليل المدعوم بالأنسجة.',
          topics: ['Tissue support', 'Multiple implants', 'Fixation pins', 'Guide stability'],
          format: 'Hands-on كامل',
        },
      ],
    },
    {
      title: 'التصميم المتقدم: All-on-4 وAll-on-6',
      description:
        'تخطيط حالات القوس الكامل وتصميم أدلة جراحية متعددة الزرعات مع التحكم بالتوازي والتثبيت والدقة عبر القوس.',
      outcomes: ['تصميم All-on-4', 'تصميم All-on-6', 'التحكم بالدقة والتوازي عبر القوس الكامل'],
      lessons: [
        {
          title: 'All-on-4 Surgical Guide Design',
          description: 'التخطيط التعويضي والجراحي لأربع زرعات وإدارة الزرعات الخلفية المائلة.',
          topics: ['Full-arch planning', 'Tilted implants', 'AP spread', 'Pin strategy'],
          format: 'Advanced workshop',
        },
        {
          title: 'All-on-6 Surgical Guide Design',
          description: 'توزيع ست زرعات وتحقيق التوازي والثبات ودقة التصميم في القوس الكامل.',
          topics: ['Implant distribution', 'Parallelism', 'Guide rigidity', 'Cross-arch control'],
          format: 'Advanced workshop',
        },
      ],
    },
    {
      title: 'الأدلة الجراحية متعددة الطبقات — التخطيط',
      description:
        'تفكيك الحالة المعقدة إلى منظومة أدلة مترابطة تحقق خفض العظم والتثبيت والتحضير بدقة متوقعة.',
      outcomes: ['تخطيط Bone Reduction Guide', 'بناء Pin Fixation Guide', 'تحديد تسلسل الأدلة'],
      lessons: [
        {
          title: 'Bone Reduction Guide',
          description: 'تصميم دليل خفض العظم وفق المساحة التعويضية والخطة الجراحية المطلوبة.',
          topics: ['Reduction plane', 'Prosthetic space', 'Bone contour', 'Safety control'],
          format: 'Advanced hands-on',
        },
        {
          title: 'Pin Fixation Guide',
          description: 'تخطيط نقاط التثبيت لضمان إعادة تموضع جميع طبقات النظام بدقة.',
          topics: ['Pin trajectory', 'Fixation stability', 'Repositioning accuracy'],
          format: 'Advanced hands-on',
        },
      ],
    },
    {
      title: 'الأدلة الجراحية متعددة الطبقات — التنفيذ',
      description:
        'استكمال منظومة Stackable Guide وربط دليل وضع الزرعات بتسلسل سريري واضح وقابل للتحقق.',
      outcomes: ['تصميم Implant Placement Guide', 'ضبط stacking sequence', 'مراجعة التنفيذ السريري المتوقع'],
      lessons: [
        {
          title: 'Implant Placement Guide',
          description: 'تصميم طبقة وضع الزرعات وربطها بالدليل المثبت والمرجع العظمي.',
          topics: ['Guide interfaces', 'Sleeve system', 'Implant sequence', 'Verification'],
          format: 'Advanced hands-on',
        },
        {
          title: 'Stacking Sequence للتنفيذ المتوقع',
          description: 'ترتيب خطوات تثبيت وإزالة وتركيب الأدلة وتقليل مصادر الخطأ التراكمي.',
          topics: ['Clinical sequence', 'Tolerance control', 'Error prevention', 'Final validation'],
          format: 'Case simulation',
        },
      ],
    },
    {
      title: 'بروتوكولات الطباعة ثلاثية الأبعاد',
      description:
        'تحويل التصميم إلى دليل جراحي مطبوع بدقة عبر إعدادات slicing والاتجاه والمعالجة اللاحقة والتعقيم.',
      outcomes: ['إعداد ملف الطباعة بصورة صحيحة', 'اختيار الاتجاه والدعامات', 'تنفيذ المعالجة والتعقيم والتحقق السريري'],
      lessons: [
        {
          title: 'إعداد الطباعة وAdvanced Chitubox Slicing',
          description: 'تهيئة ملف الدليل واختيار اتجاه الطباعة والدعامات بما يحافظ على دقة الأسطح الحرجة.',
          topics: ['Slicing strategy', 'Guide orientation', 'Supports', 'Layer settings'],
          format: 'تطبيق عملي',
        },
        {
          title: 'اختيار الراتنج وتحسين الدقة',
          description: 'اختيار Resin مناسب للدليل الجراحي وضبط عوامل الانكماش والدقة.',
          topics: ['Surgical guide resin', 'Dimensional accuracy', 'Printer calibration'],
          format: 'Lab workflow',
        },
        {
          title: 'المعالجة اللاحقة والتعقيم والتحقق',
          description: 'الغسل والمعالجة الضوئية والتعقيم وفحص انطباق الدليل قبل الاستخدام السريري.',
          topics: ['Post-curing', 'Sterilization', 'Fit verification', 'Clinical validation'],
          format: 'Lab + clinical checklist',
        },
      ],
    },
  ];

  await prisma.$transaction(
    async (tx) => {
      await tx.curriculumModule.deleteMany({ where: { courseId: course.id } });
      for (const [moduleIndex, module] of guidedSurgeryCurriculum.entries()) {
        await tx.curriculumModule.create({
          data: {
            courseId: course.id,
            title: module.title,
            description: module.description,
            outcomes: module.outcomes,
            sortOrder: moduleIndex,
            lessons: {
              create: module.lessons.map((lesson, lessonIndex) => ({
                ...lesson,
                sortOrder: lessonIndex,
              })),
            },
          },
        });
      }
    },
    { timeout: 120_000 },
  );

  await prisma.instructorTranslation.upsert({
    where: {
      instructorId_locale: { instructorId: instructor.id, locale: 'ar' },
    },
    update: {
      name: 'د. عمار العبيدي',
      title: 'المؤسس والرئيس التنفيذي لـ DentaCollab',
      biography:
        'دكتوراه في أشعة الفم والوجه والفكين، مؤسس DentaCollab ورئيس الجمعية العراقية لطب الأسنان الرقمي، ومدرب Exoplan ITC.',
      experience: 'خبير في طب الأسنان الرقمي، الأشعة، وتخطيط الزرعات الرقمي',
      certificates: [
        'Ph.D. Oral & Maxillofacial Radiology',
        'President of Iraqi Digital Dental Society',
        'Exoplan ITC Trainer',
      ],
    },
    create: {
      instructorId: instructor.id,
      locale: 'ar',
      name: 'د. عمار العبيدي',
      title: 'المؤسس والرئيس التنفيذي لـ DentaCollab',
      biography:
        'دكتوراه في أشعة الفم والوجه والفكين، مؤسس DentaCollab ورئيس الجمعية العراقية لطب الأسنان الرقمي، ومدرب Exoplan ITC.',
      experience: 'خبير في طب الأسنان الرقمي، الأشعة، وتخطيط الزرعات الرقمي',
      certificates: [
        'Ph.D. Oral & Maxillofacial Radiology',
        'President of Iraqi Digital Dental Society',
        'Exoplan ITC Trainer',
      ],
    },
  });

  await prisma.instructorTranslation.upsert({
    where: {
      instructorId_locale: { instructorId: instructor.id, locale: 'en' },
    },
    update: {
      name: 'Dr. Ammar Al-Obaidi',
      title: 'Founder & CEO of DentaCollab',
      biography:
        'Ph.D. in Oral & Maxillofacial Radiology, founder of DentaCollab, President of the Iraqi Digital Dental Society, and Exoplan ITC trainer.',
      experience: 'Expert in digital dentistry, radiology, and digital implant planning',
      certificates: [
        'Ph.D. Oral & Maxillofacial Radiology',
        'President of Iraqi Digital Dental Society',
        'Exoplan ITC Trainer',
      ],
    },
    create: {
      instructorId: instructor.id,
      locale: 'en',
      name: 'Dr. Ammar Al-Obaidi',
      title: 'Founder & CEO of DentaCollab',
      biography:
        'Ph.D. in Oral & Maxillofacial Radiology, founder of DentaCollab, President of the Iraqi Digital Dental Society, and Exoplan ITC trainer.',
      experience: 'Expert in digital dentistry, radiology, and digital implant planning',
      certificates: [
        'Ph.D. Oral & Maxillofacial Radiology',
        'President of Iraqi Digital Dental Society',
        'Exoplan ITC Trainer',
      ],
    },
  });

  await prisma.courseTranslation.upsert({
    where: { courseId_locale: { courseId: course.id, locale: 'ar' } },
    update: {
      title: course.title,
      description: course.description,
      overview: course.overview,
      objectives: course.objectives,
      requirements: course.requirements,
      duration: course.duration,
      certificate: course.certificate,
    },
    create: {
      courseId: course.id,
      locale: 'ar',
      title: course.title,
      description: course.description,
      overview: course.overview,
      objectives: course.objectives,
      requirements: course.requirements,
      duration: course.duration,
      certificate: course.certificate,
    },
  });

  await prisma.courseTranslation.upsert({
    where: { courseId_locale: { courseId: course.id, locale: 'en' } },
    update: {
      title: 'Guided Implant Surgery Masterclass',
      description:
        'An advanced professional program covering digital implant planning and surgical guide design using CBCT, intraoral scanning, Exoplan and 3D printing.',
      overview:
        'Master the complete guided-surgery workflow: CBCT interpretation, DICOM–STL alignment, anatomically safe implant planning, single and multiple guides, All-on-4/All-on-6, stackable guides, printing, post-processing and clinical validation.',
      objectives: [
        'Interpret CBCT scans and identify critical anatomical landmarks',
        'Evaluate oral scans and accurately align DICOM and STL datasets',
        'Plan implant position, angulation and depth with safety margins',
        'Design single, multiple and full-arch surgical guides in Exoplan',
        'Build multi-layered stackable guide workflows',
        'Prepare, print, post-cure, sterilize and clinically validate guides',
      ],
      requirements: [
        'Dentist, implantologist or oral and maxillofacial professional',
        'Basic understanding of implant dentistry',
        'A suitable computer for 3D planning and design',
        'DICOM and STL case files are recommended for hands-on practice',
      ],
      duration: 'Intensive masterclass',
      certificate: 'DentaCollab accredited professional completion certificate',
    },
    create: {
      courseId: course.id,
      locale: 'en',
      title: 'Guided Implant Surgery Masterclass',
      description:
        'An advanced professional program covering digital implant planning and surgical guide design using CBCT, intraoral scanning, Exoplan and 3D printing.',
      overview:
        'Master the complete guided-surgery workflow: CBCT interpretation, DICOM–STL alignment, anatomically safe implant planning, single and multiple guides, All-on-4/All-on-6, stackable guides, printing, post-processing and clinical validation.',
      objectives: [
        'Interpret CBCT scans and identify critical anatomical landmarks',
        'Evaluate oral scans and accurately align DICOM and STL datasets',
        'Plan implant position, angulation and depth with safety margins',
        'Design single, multiple and full-arch surgical guides in Exoplan',
        'Build multi-layered stackable guide workflows',
        'Prepare, print, post-cure, sterilize and clinically validate guides',
      ],
      requirements: [
        'Dentist, implantologist or oral and maxillofacial professional',
        'Basic understanding of implant dentistry',
        'A suitable computer for 3D planning and design',
        'DICOM and STL case files are recommended for hands-on practice',
      ],
      duration: 'Intensive masterclass',
      certificate: 'DentaCollab accredited professional completion certificate',
    },
  });

  await seedExoplanCourses(prisma, publishedInstructorIds);

  await prisma.course.updateMany({
    where: { slug: { notIn: EXOPLAN_COURSE_SLUGS } },
    data: { status: PublishStatus.ARCHIVED },
  });

  await prisma.faq.createMany({
    data: [
      {
        question: 'هل الدورات حضورية أم عن بعد؟',
        answer: 'نقدم برامج حضورية وهجينة حسب نوع الدورة.',
        category: 'عام',
      },
      {
        question: 'هل أحصل على شهادة؟',
        answer: 'نعم، يحصل المتخرج على شهادة معتمدة من DentaCollab.',
        category: 'الشهادات',
      },
    ],
    skipDuplicates: true,
  });

  const faqRows = await prisma.faq.findMany({ orderBy: { createdAt: 'asc' } });
  const faqEnglish = [
    {
      question: 'Are the courses in-person or online?',
      answer: 'We offer in-person and hybrid programs depending on the course.',
      category: 'General',
    },
    {
      question: 'Will I receive a certificate?',
      answer: 'Yes. Graduates receive an accredited DentaCollab certificate.',
      category: 'Certificates',
    },
  ];
  for (const [index, row] of faqRows.slice(0, 2).entries()) {
    const copy = faqEnglish[index];
    await prisma.faqTranslation.upsert({
      where: { faqId_locale: { faqId: row.id, locale: 'en' } },
      update: copy,
      create: { faqId: row.id, locale: 'en', ...copy },
    });
  }

  const existingTestimonial = await prisma.testimonial.findFirst({
    where: { name: 'د. أحمد نور' },
  });
  const testimonial =
    existingTestimonial ??
    (await prisma.testimonial.create({
      data: {
        name: 'د. أحمد نور',
        profession: 'طبيب أسنان',
        rating: 5,
        review: 'تجربة رائعة ونقلة نوعية في ممارستي الرقمية.',
        imageUrl: '/dentacollab-hero.png',
      },
    }));
  await prisma.testimonialTranslation.upsert({
    where: { testimonialId_locale: { testimonialId: testimonial.id, locale: 'en' } },
    update: {
      name: 'Dr. Ahmed Noor',
      profession: 'Dentist',
      review: 'An outstanding experience that transformed my digital practice.',
    },
    create: {
      testimonialId: testimonial.id,
      locale: 'en',
      name: 'Dr. Ahmed Noor',
      profession: 'Dentist',
      review: 'An outstanding experience that transformed my digital practice.',
    },
  });

  const extraTestimonials = [
    {
      name: 'د. سارة محمود',
      profession: 'أخصائية زراعة أسنان',
      review: 'المحتوى عملي جداً والتخطيط على Exoplan صار أوضح بعد الدورة.',
      imageUrl: '/dentacollab-hero.png',
      en: {
        name: 'Dr. Sara Mahmoud',
        profession: 'Implantologist',
        review: 'Very practical content — Exoplan planning became much clearer after the course.',
      },
    },
    {
      name: 'د. كريم العلي',
      profession: 'جراح فم وفكين',
      review: 'تنظيم ممتاز وتطبيقات سريرية حقيقية تفيد العيادة مباشرة.',
      imageUrl: '/dentacollab-hero.png',
      en: {
        name: 'Dr. Kareem Al-Ali',
        profession: 'Oral Surgeon',
        review: 'Excellent structure with real clinical applications that help the clinic immediately.',
      },
    },
  ];
  for (const item of extraTestimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: item.name } });
    const row =
      existing ??
      (await prisma.testimonial.create({
        data: {
          name: item.name,
          profession: item.profession,
          rating: 5,
          review: item.review,
          imageUrl: item.imageUrl,
          isPublished: true,
        },
      }));
    await prisma.testimonial.update({
      where: { id: row.id },
      data: { imageUrl: item.imageUrl, isPublished: true },
    });
    await prisma.testimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: row.id, locale: 'en' } },
      update: item.en,
      create: { testimonialId: row.id, locale: 'en', ...item.en },
    });
  }

  const graduateSeeds = [
    {
      fullName: 'د. لينا حسن',
      courseTitle: 'ماستر كلاس الجراحة الموجّهة لزراعة الأسنان',
      description: 'أنهت البرنامج بتميّز في تخطيط الأدلة الجراحية.',
      imageUrl: '/dentacollab-hero.png',
      certificateUrl: '/dentacollab-hero.png',
      en: {
        fullName: 'Dr. Lina Hassan',
        courseTitle: 'Guided Implant Surgery Masterclass',
        description: 'Completed the program with excellence in surgical guide planning.',
      },
    },
    {
      fullName: 'د. يوسف راضي',
      courseTitle: 'ماستر كلاس الجراحة الموجّهة لزراعة الأسنان',
      description: 'تطبيق عملي قوي على حالات All-on-4.',
      imageUrl: '/dentacollab-hero.png',
      certificateUrl: '/dentacollab-hero.png',
      en: {
        fullName: 'Dr. Yousef Radhi',
        courseTitle: 'Guided Implant Surgery Masterclass',
        description: 'Strong practical application on All-on-4 cases.',
      },
    },
  ];
  for (const item of graduateSeeds) {
    const existing = await prisma.graduate.findFirst({ where: { fullName: item.fullName } });
    const row =
      existing ??
      (await prisma.graduate.create({
        data: {
          fullName: item.fullName,
          courseTitle: item.courseTitle,
          description: item.description,
          imageUrl: item.imageUrl,
          certificateUrl: item.certificateUrl,
          courseId: course.id,
          graduationDate: new Date('2026-05-15'),
          isPublished: true,
        },
      }));
    await prisma.graduate.update({
      where: { id: row.id },
      data: {
        imageUrl: item.imageUrl,
        certificateUrl: item.certificateUrl,
        courseId: course.id,
        isPublished: true,
      },
    });
    await prisma.graduateTranslation.upsert({
      where: { graduateId_locale: { graduateId: row.id, locale: 'en' } },
      update: item.en,
      create: { graduateId: row.id, locale: 'en', ...item.en },
    });
  }

  const albumExisting = await prisma.galleryAlbum.findFirst({
    where: { title: 'ورش العمل السريرية' },
  });
  const album =
    albumExisting ??
    (await prisma.galleryAlbum.create({
      data: {
        title: 'ورش العمل السريرية',
        description: 'لحظات من التدريب العملي داخل الأكاديمية.',
        coverUrl: '/dentacollab-hero.png',
        isPublished: true,
        media: {
          create: [
            {
              url: '/dentacollab-hero.png',
              title: 'ورشة مسح',
              type: 'IMAGE',
              sortOrder: 0,
            },
            {
              url: '/dentacollab-hero.png',
              title: 'جلسة تخطيط',
              type: 'IMAGE',
              sortOrder: 1,
            },
            {
              url: '/dentacollab-hero.png',
              title: 'بيئة العيادة',
              type: 'IMAGE',
              sortOrder: 2,
            },
          ],
        },
      },
    }));
  await prisma.galleryAlbum.update({
    where: { id: album.id },
    data: {
      coverUrl: '/dentacollab-hero.png',
      isPublished: true,
    },
  });
  await prisma.galleryAlbumTranslation.upsert({
    where: { albumId_locale: { albumId: album.id, locale: 'en' } },
    update: {
      title: 'Clinical workshops',
      description: 'Moments from hands-on training inside the academy.',
    },
    create: {
      albumId: album.id,
      locale: 'en',
      title: 'Clinical workshops',
      description: 'Moments from hands-on training inside the academy.',
    },
  });
  const mediaCount = await prisma.galleryMedia.count({ where: { albumId: album.id } });
  if (!mediaCount) {
    await prisma.galleryMedia.createMany({
      data: [
        {
          albumId: album.id,
          url: '/dentacollab-hero.png',
          title: 'ورشة مسح',
          type: 'IMAGE',
          sortOrder: 0,
        },
        {
          albumId: album.id,
          url: '/dentacollab-hero.png',
          title: 'جلسة تخطيط',
          type: 'IMAGE',
          sortOrder: 1,
        },
        {
          albumId: album.id,
          url: '/dentacollab-hero.png',
          title: 'بيئة العيادة',
          type: 'IMAGE',
          sortOrder: 2,
        },
      ],
    });
  }

  await prisma.siteContent.createMany({
    data: [
      {
        key: 'hero',
        title: 'DentaCollab',
        body: 'أكاديمية متخصصة في طب الأسنان الرقمي لتمكين الأطباء والمختبرات.',
        imageUrl: '/dentacollab-hero.png',
        data: { cta: 'استكشف الدورات', ctaLink: '/courses' },
      },
      {
        key: 'about',
        title: 'من نحن',
        body: 'DentaCollab منصة تعليمية وتطبيقية تجمع بين الخبرة السريرية والتقنية.',
        imageUrl: '/dentacollab-hero.png',
      },
      {
        key: 'benefits',
        title: 'مزايا الطالب',
        body: 'تدريب عملي، محتوى محدّث، ومتابعة احترافية.',
        imageUrl: '/dentacollab-hero.png',
        data: {
          items: ['مناهج عملية', 'مدربون خبراء', 'شهادات معتمدة', 'مجتمع مهني'],
        },
      },
      {
        key: 'footer',
        title: 'DentaCollab',
        body: 'نحو عيادة رقمية أكثر دقة وكفاءة.',
        imageUrl: '/logo.png',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.siteContent.update({
    where: { key: 'about' },
    data: { imageUrl: '/dentacollab-hero.png' },
  }).catch(() => undefined);
  await prisma.siteContent.update({
    where: { key: 'benefits' },
    data: { imageUrl: '/dentacollab-hero.png' },
  }).catch(() => undefined);
  await prisma.siteContent.update({
    where: { key: 'hero' },
    data: { imageUrl: '/dentacollab-hero.png' },
  }).catch(() => undefined);

  const englishContent: Record<string, { title?: string; body?: string; data?: object }> = {
    hero: {
      title: 'Master Digital Dentistry',
      body:
        'Professional Exocad and Exoplan training with real clinical cases and hands-on experience.',
      data: { cta: 'Explore Courses', ctaLink: '/courses' },
    },
    about: {
      title: 'About DentaCollab',
      body:
        'A specialized academy where clinical expertise meets the latest digital dentistry technology.',
    },
    benefits: {
      title: 'Why DentaCollab?',
      body: 'Practical education designed for confident real-world outcomes.',
      data: {
        items: [
          'Hands-on curricula',
          'Industry expert instructors',
          'Accredited certificates',
          'Professional community',
        ],
      },
    },
    footer: {
      title: 'DentaCollab',
      body: 'Precision is not optional in digital dentistry.',
    },
  };
  const contentRows = await prisma.siteContent.findMany();
  for (const row of contentRows) {
    const copy = englishContent[row.key];
    if (!copy) continue;
    await prisma.siteContentTranslation.upsert({
      where: { contentId_locale: { contentId: row.id, locale: 'en' } },
      update: copy,
      create: { contentId: row.id, locale: 'en', ...copy },
    });
  }

  await prisma.setting.upsert({
    where: { key: 'general' },
    update: {
      value: {
        siteName: 'DentaCollab',
        tagline: 'أكاديمية طب الأسنان الرقمي',
        email: '',
        phone: '+9647817828545',
        whatsapp: '+9647817828545',
        location: 'موقع الأكاديمية',
        locationEn: 'Academy location',
        coordinates: "33°17'16.0\"N 44°20'52.4\"E",
        mapsUrl: 'https://maps.app.goo.gl/qJ7KMyB6dQEuxGQE7?g_st=ic',
        logoUrl: '',
      },
    },
    create: {
      key: 'general',
      value: {
        siteName: 'DentaCollab',
        tagline: 'أكاديمية طب الأسنان الرقمي',
        email: '',
        phone: '+9647817828545',
        whatsapp: '+9647817828545',
        location: 'موقع الأكاديمية',
        locationEn: 'Academy location',
        coordinates: "33°17'16.0\"N 44°20'52.4\"E",
        mapsUrl: 'https://maps.app.goo.gl/qJ7KMyB6dQEuxGQE7?g_st=ic',
        logoUrl: '',
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'seo' },
    update: {},
    create: {
      key: 'seo',
      value: {
        title: 'DentaCollab | أكاديمية طب الأسنان الرقمي',
        description: 'دورات وبرامج احترافية في Digital Dentistry',
        keywords: ['طب أسنان رقمي', 'CAD/CAM', 'DentaCollab'],
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'social' },
    update: {
      value: {
        instagram: 'https://www.instagram.com/dentacollab',
        facebook: 'https://www.facebook.com/Digitaldentistrytrainingcourses',
      },
    },
    create: {
      key: 'social',
      value: {
        instagram: 'https://www.instagram.com/dentacollab',
        facebook: 'https://www.facebook.com/Digitaldentistrytrainingcourses',
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: 'chatbot' },
    update: {},
    create: {
      key: 'chatbot',
      value: {
        welcomeAr: 'مرحباً بك في DentaCollab. كيف أقدر أساعدك بخصوص الدورات أو التسجيل؟',
        welcomeEn: 'Welcome to DentaCollab. How can I help with courses or registration?',
        goodbyeAr: 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!',
        goodbyeEn: 'Thanks for chatting with us. Have a great day!',
        outOfScopeAr:
          'عذراً، هذا السؤال خارج نطاق الأسئلة المتوفرة. يمكنك التواصل مع الدعم عبر واتساب.',
        outOfScopeEn:
          'Sorry, that question is outside our FAQ. You can reach support on WhatsApp.',
      },
    },
  });

  const chatbotQaCount = await prisma.chatBotQa.count();
  if (!chatbotQaCount) {
    await prisma.chatBotQa.createMany({
      data: [
        {
          questionAr: 'ما هي DentaCollab؟',
          answerAr: 'DentaCollab أكاديمية متخصصة في تعليم وتطبيقات طب الأسنان الرقمي.',
          questionEn: 'What is DentaCollab?',
          answerEn: 'DentaCollab is an academy specialized in digital dentistry education and practice.',
          sortOrder: 0,
        },
        {
          questionAr: 'كيف أسجل في دورة؟',
          answerAr: 'افتح صفحة الدورة ثم عبّئ نموذج التسجيل وسيقوم الفريق بالتواصل معك.',
          questionEn: 'How do I register for a course?',
          answerEn: 'Open the course page, fill in the registration form, and our team will contact you.',
          sortOrder: 1,
        },
        {
          questionAr: 'هل توجد شهادة؟',
          answerAr: 'نعم، تُمنح شهادة معتمدة بعد إكمال متطلبات الدورة بنجاح.',
          questionEn: 'Is there a certificate?',
          answerEn: 'Yes, an accredited certificate is awarded after successfully completing the course requirements.',
          sortOrder: 2,
        },
      ],
    });
  }

  await prisma.knowledgeCategory.create({
    data: {
      name: 'عام',
      entries: {
        create: [
          {
            question: 'ما هي DentaCollab؟',
            answer: 'DentaCollab أكاديمية متخصصة في تعليم وتطبيقات طب الأسنان الرقمي.',
          },
          {
            question: 'كيف أسجل في دورة؟',
            answer: 'افتح صفحة الدورة ثم عبّئ نموذج التسجيل وسيقوم الفريق بالتواصل معك.',
          },
        ],
      },
    },
  }).catch(() => undefined);

  const entries = await prisma.knowledgeEntry.findMany();
  for (const e of entries) {
    const text = `${e.question} ${e.answer}`;
    const dim = 64;
    const embedding = new Array(dim).fill(0).map((_, i) => {
      let v = 0;
      for (let j = 0; j < text.length; j++) v += text.charCodeAt(j) * ((i + 1) / (j + 1));
      return v % 1;
    });
    const existing = await prisma.knowledgeChunk.count({ where: { entryId: e.id } });
    if (!existing) {
      await prisma.knowledgeChunk.create({
        data: { entryId: e.id, content: text, embedding },
      });
    }
  }

  // Remove legacy auto-slugged seed copies so workshops stay tidy
  await prisma.calendarEvent.deleteMany({
    where: {
      AND: [
        { title: 'ورشة المسح داخل الفم' },
        { NOT: { slug: 'intraoral-scanning-workshop' } },
      ],
    },
  });

  await prisma.calendarEvent.upsert({
    where: { slug: 'intraoral-scanning-workshop' },
    update: {
      title: 'ورشة المسح داخل الفم',
      titleEn: 'Intraoral Scanning Workshop',
      description: 'ورشة عملية للمبتدئين حول المسح داخل الفم وسير العمل الرقمي.',
      descriptionEn: 'A hands-on beginner workshop on intraoral scanning and digital workflow.',
      location: 'مختبر DentaCollab',
      locationEn: 'DentaCollab Lab',
      coverUrl: '/dentacollab-hero.png',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isPublished: false,
      isFeatured: false,
    },
    create: {
      slug: 'intraoral-scanning-workshop',
      title: 'ورشة المسح داخل الفم',
      titleEn: 'Intraoral Scanning Workshop',
      description: 'ورشة عملية للمبتدئين حول المسح داخل الفم وسير العمل الرقمي.',
      descriptionEn: 'A hands-on beginner workshop on intraoral scanning and digital workflow.',
      location: 'مختبر DentaCollab',
      locationEn: 'DentaCollab Lab',
      coverUrl: '/dentacollab-hero.png',
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isPublished: false,
      isFeatured: false,
    },
  });

  console.log('Seed complete. Admin: admin@dentacollab.com / Admin123!');
  console.log('Published Exoplan courses:', EXOPLAN_COURSE_SLUGS.join(', '));

  // Replace leftover Unsplash placeholders with local brand assets.
  // Real production images should be uploaded via Admin → Media (R2 when configured).
  const localHero = '/dentacollab-hero.png';
  await prisma.course.updateMany({
    where: { coverUrl: { contains: 'unsplash' } },
    data: { coverUrl: localHero },
  });
  await prisma.courseGallery.updateMany({
    where: { url: { contains: 'unsplash' } },
    data: { url: localHero },
  });
  await prisma.testimonial.updateMany({
    where: { imageUrl: { contains: 'unsplash' } },
    data: { imageUrl: localHero },
  });
  await prisma.graduate.updateMany({
    where: { imageUrl: { contains: 'unsplash' } },
    data: { imageUrl: localHero },
  });
  await prisma.graduate.updateMany({
    where: { certificateUrl: { contains: 'unsplash' } },
    data: { certificateUrl: localHero },
  });
  await prisma.galleryAlbum.updateMany({
    where: { coverUrl: { contains: 'unsplash' } },
    data: { coverUrl: localHero },
  });
  await prisma.galleryMedia.updateMany({
    where: { url: { contains: 'unsplash' } },
    data: { url: localHero },
  });
  await prisma.siteContent.updateMany({
    where: { imageUrl: { contains: 'unsplash' } },
    data: { imageUrl: localHero },
  });
  await prisma.instructor.updateMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: '' }, { imageUrl: { contains: 'unsplash' } }],
    },
    data: { imageUrl: '/dr-ammar.png' },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
