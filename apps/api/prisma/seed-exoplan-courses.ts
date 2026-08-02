import { PrismaClient, CourseLevel, PublishStatus, FormFieldType, Prisma } from '@prisma/client';

type LessonSeed = {
  title: string;
  description?: string;
  topics?: string[];
  format?: string;
  duration?: string;
};

type ModuleSeed = {
  title: string;
  description?: string;
  outcomes?: string[];
  lessons: LessonSeed[];
};

type LocaleCopy = {
  title: string;
  description: string;
  overview: string;
  objectives: string[];
  requirements: string[];
  duration: string;
  certificate: string;
};

type CourseSeed = {
  slug: string;
  sortOrder: number;
  level: CourseLevel;
  price: number;
  currency: string;
  coverUrl: string;
  ar: LocaleCopy;
  en: LocaleCopy;
  curriculum: ModuleSeed[];
};

const COVER = '/dentacollab-hero.png';

const exoplanCourses: CourseSeed[] = [
  {
    slug: 'exoplan-graduates-basic',
    sortOrder: 1,
    level: CourseLevel.BASIC,
    price: 250,
    currency: 'USD',
    coverUrl: COVER,
    ar: {
      title: 'كورس Exoplan للخريجين (المستوى الأساسي)',
      description:
        'برنامج أساسي من الصفر للخريجين يغطي تخطيط الزرعات وتصميم الدليل الجراحي في Exoplan وصولاً إلى الطباعة ثلاثية الأبعاد مع ورشة Chitbox.',
      overview:
        'دورة مكثفة على يومين تبدأ من مقدمة البرنامج وتحميل ومحاذاة DICOM وSTL، ثم رسم مسار العصب وتقسيم الجيوب، وتخطيط الزرعات المنفردة والجسور، وضبط المواقع والزوايا والتوازي، ووضع Anchor Pins والـ Sleeves، وتحقيق دقة Full-Arch، وتصميم الدليل عبر Guide Creator، وتصدير STL، مع ورشة مباشرة لمسار الطباعة باستخدام Chitbox. تشمل متابعة وتدريباً مستمراً لمدة شهر بعد الكورس.',
      objectives: [
        'التعرف على واجهة Exoplan وسير العمل الأساسي',
        'تحميل ومحاذاة ملفات DICOM وSTL بدقة',
        'رسم مسار العصب وتقسيم الجيوب الأنفية',
        'تخطيط الزرعات المنفردة والجسور وضبط الزوايا والتوازي',
        'وضع Anchor Pins والـ Sleeves وتصميم الدليل الجراحي',
        'تصدير ملفات STL وتنفيذ مسار الطباعة عبر Chitbox',
      ],
      requirements: [
        'خريج طب أسنان أو ممارس في بداية مسار الزراعة الرقمية',
        'يفضّل توفر ملفات DICOM وSTL للتطبيق العملي',
      ],
      duration: 'يومان',
      certificate: 'شهادة مشاركة (غير معتمدة)',
    },
    en: {
      title: 'Exoplan Course for Graduates (Basic Level)',
      description:
        'A from-scratch basic program for graduates covering implant planning and surgical guide design in Exoplan through to 3D printing with a live Chitbox workshop.',
      overview:
        'An intensive two-day course covering Exoplan introduction, DICOM + STL loading and alignment, nerve canal tracing and sinus segmentation, single and bridge implant planning, positioning, angulation and parallelism, Anchor Pins and Sleeves, full-arch cross-arch accuracy, Guide Creator design, STL export, and a live 3D printing workflow with Chitbox. Includes one month of continued follow-up and training after the course.',
      objectives: [
        'Get started with Exoplan and the core workflow',
        'Load and accurately align DICOM and STL files',
        'Trace the nerve canal and segment the sinus',
        'Plan single and bridge implants with correct angulation and parallelism',
        'Place Anchor Pins and Sleeves and design the surgical guide',
        'Export STL files and run the printing workflow in Chitbox',
      ],
      requirements: [
        'Dental graduate or early-career implant practitioner',
        'DICOM and STL case files are recommended for hands-on practice',
      ],
      duration: '2 days',
      certificate: 'Participation certificate (not accredited)',
    },
    curriculum: [
      {
        title: 'المنهاج التدريبي — المستوى الأساسي للخريجين',
        description: 'مسار عملي كامل من استيراد البيانات حتى طباعة الدليل الجراحي.',
        outcomes: [
          'إكمال تخطيط زرعات أساسي في Exoplan',
          'تصميم دليل جراحي قابل للطباعة',
          'تطبيق مسار الطباعة في Chitbox',
        ],
        lessons: [
          {
            title: 'مقدمة عن برنامج Exoplan',
            description: 'التعرف على الواجهة، الأدوات الأساسية، وسير العمل في البرنامج.',
            topics: ['Interface', 'Workflow overview', 'Project setup'],
            format: 'نظري',
          },
          {
            title: 'تحميل ومحاذاة ملفات DICOM و STL',
            description: 'استيراد بيانات CBCT والمسح الفموي وتحقيق محاذاة دقيقة.',
            topics: ['DICOM import', 'STL import', 'Alignment'],
            format: 'عملي',
          },
          {
            title: 'رسم وتحديد مسار العصب وتقسيم الجيوب الأنفية',
            description: 'بناء خريطة أمان تشريحية قبل وضع الزرعات.',
            topics: ['Nerve canal tracing', 'Sinus segmentation', 'Safety mapping'],
            format: 'عملي',
          },
          {
            title: 'تخطيط الزرعات (الزرعات المنفردة والجسور)',
            description: 'اختيار الزرعة وتخطيط الحالات المنفردة وحالات الجسور.',
            topics: ['Single implant', 'Bridge planning', 'Implant library'],
            format: 'عملي',
          },
          {
            title: 'تحديد مواقع الزرعات، الزوايا والتوازي',
            description: 'ضبط الموضع والاتجاه والتوازي وفق الخطة التعويضية.',
            topics: ['Positioning', 'Angulation', 'Parallelism'],
            format: 'عملي',
          },
          {
            title: 'وضع دبابيس التثبيت (Anchor Pins) والحلقات (Sleeves)',
            description: 'تأمين ثبات الدليل واختيار الـ sleeves المناسبة.',
            topics: ['Anchor pins', 'Sleeve placement', 'Guide stability'],
            format: 'عملي',
          },
          {
            title: 'تحقيق دقة المحاذاة الشاملة للفك الكامل (Full-Arch)',
            description: 'التحكم بالدقة عبر القوس الكامل في حالات Full-Arch.',
            topics: ['Cross-arch accuracy', 'Full-arch control', 'Verification'],
            format: 'عملي',
          },
          {
            title: 'تصميم الدليل الجراحي باستخدام Guide Creator',
            description: 'بناء الدليل الجراحي وضبط السماكة ونوافذ الفحص والدعم.',
            topics: ['Guide Creator', 'Support design', 'Inspection windows'],
            format: 'Hands-on',
          },
          {
            title: 'تصدير ملفات STL للطباعة ثلاثية الأبعاد',
            description: 'تجهيز الملفات النهائية الجاهزة للطباعة.',
            topics: ['STL export', 'Print readiness', 'File check'],
            format: 'عملي',
          },
          {
            title: 'ورشة عمل مباشرة لمسار الطباعة 3D باستخدام Chitbox',
            description: 'تطبيق عملي مباشر على إعدادات الطباعة والتقطيع في Chitbox.',
            topics: ['Chitbox', 'Slicing', 'Supports', 'Print settings'],
            format: 'ورشة مباشرة',
          },
        ],
      },
    ],
  },
  {
    slug: 'exoplan-students-basic',
    sortOrder: 2,
    level: CourseLevel.STUDENTS,
    price: 150,
    currency: 'USD',
    coverUrl: COVER,
    ar: {
      title: 'كورس Exoplan للطلاب (المستوى الأساسي)',
      description:
        'دورة أساسية مخصّصة لطلاب طب الأسنان للتعرّف على Exoplan وتخطيط الزرعات المنفردة وتصميم الدليل الجراحي وتصدير STL.',
      overview:
        'يوم تدريبي واحد يغطي مقدمة Exoplan، تحميل ومحاذاة DICOM وSTL، تخطيط الزرعات المنفردة، ضبط المواقع والزوايا والتوازي، تصميم الدليل عبر Guide Creator، وتصدير ملفات STL للطباعة ثلاثية الأبعاد.',
      objectives: [
        'التعرف على أساسيات برنامج Exoplan',
        'تحميل ومحاذاة ملفات DICOM وSTL',
        'تخطيط زرعة منفردة بشكل صحيح',
        'ضبط موقع الزرعة والزاوية والتوازي',
        'تصميم دليل جراحي أساسي وتصدير STL',
      ],
      requirements: [
        'طالب طب أسنان',
        'اهتمام بمجال الزراعة الرقمية والتخطيط ثلاثي الأبعاد',
      ],
      duration: 'يوم واحد',
      certificate: 'شهادة مشاركة (غير معتمدة)',
    },
    en: {
      title: 'Exoplan Course for Students (Basic Level)',
      description:
        'A basic one-day course for dental students covering Exoplan, single implant planning, surgical guide design and STL export.',
      overview:
        'A focused training day covering Exoplan introduction, DICOM + STL loading and alignment, single implant planning, positioning, angulation and parallelism, Guide Creator design, and STL export for 3D printing.',
      objectives: [
        'Learn the fundamentals of Exoplan',
        'Load and align DICOM and STL files',
        'Plan a single implant correctly',
        'Control implant position, angulation and parallelism',
        'Design a basic surgical guide and export STL',
      ],
      requirements: [
        'Dental student',
        'Interest in digital implant planning',
      ],
      duration: '1 day',
      certificate: 'Participation certificate (not accredited)',
    },
    curriculum: [
      {
        title: 'المنهاج التدريبي — المستوى الأساسي للطلاب',
        description: 'مسار مبسّط يركّز على الزرعة المنفردة وتصميم الدليل الأساسي.',
        outcomes: [
          'إتمام تخطيط زرعة منفردة',
          'تصميم دليل جراحي أساسي',
          'تصدير ملف STL جاهز للطباعة',
        ],
        lessons: [
          {
            title: 'مقدمة عن برنامج Exoplan',
            description: 'التعرف على البرنامج وسير العمل الأساسي لطلاب طب الأسنان.',
            topics: ['Interface', 'Basic workflow'],
            format: 'نظري',
          },
          {
            title: 'تحميل ومحاذاة ملفات DICOM و STL',
            description: 'استيراد ومحاذاة بيانات الأشعة والمسح الرقمي.',
            topics: ['DICOM', 'STL', 'Alignment'],
            format: 'عملي',
          },
          {
            title: 'تخطيط الزرعات المنفردة',
            description: 'اختيار الزرعة ووضعها في الحالة المنفردة.',
            topics: ['Single implant', 'Implant selection'],
            format: 'عملي',
          },
          {
            title: 'تحديد مواقع الزرعات، الزوايا، والتوازي',
            description: 'ضبط الموضع والاتجاه والتوازي بأمان.',
            topics: ['Positioning', 'Angulation', 'Parallelism'],
            format: 'عملي',
          },
          {
            title: 'تصميم الدليل الجراحي باستخدام Guide Creator',
            description: 'بناء الدليل الجراحي الأساسي للحالة المنفردة.',
            topics: ['Guide Creator', 'Basic guide design'],
            format: 'Hands-on',
          },
          {
            title: 'تصدير ملفات STL للطباعة ثلاثية الأبعاد',
            description: 'تصدير الملفات النهائية للطباعة.',
            topics: ['STL export', '3D printing prep'],
            format: 'عملي',
          },
        ],
      },
    ],
  },
  {
    slug: 'exoplan-professional-advanced',
    sortOrder: 3,
    level: CourseLevel.ADVANCED,
    price: 750,
    currency: 'USD',
    coverUrl: COVER,
    ar: {
      title: 'كورس الاكسوبلان الاحترافي (المتقدم)',
      description:
        'برنامج احترافي متقدم لتصميم الأدلة الجراحية من الزرعة المنفردة حتى All-on-4 وAll-on-6 والأدلة متعددة الطبقات، مع مسار الطباعة ثلاثية الأبعاد.',
      overview:
        'دورة متقدمة على أربعة أيام تغطي تقييم ومطابقة CBCT مع الطبعة الرقمية، وتصميم الأدلة للزرعات المنفردة والمتعددة (Tissue Supported)، وحالات All-on-4 وAll-on-6، والأدلة متعددة الطبقات القابلة للتجميع (جزأين)، ومسار الطباعة ثلاثية الأبعاد. شرط القبول: إتمام كورس الأساسيات (Basic Level) لبرنامج Exoplan.',
      objectives: [
        'تقييم وقراءة صور CBCT ومطابقتها مع الطبعة الرقمية',
        'تصميم دليل جراحي لزرعة منفردة',
        'تصميم أدلة للحالات المتعددة المدعومة بالأنسجة',
        'تصميم أدلة All-on-4 وAll-on-6',
        'بناء أدلة متعددة الطبقات قابلة للتجميع',
        'إتقان مسار وتفاصيل الطباعة ثلاثية الأبعاد',
      ],
      requirements: [
        'إتمام كورس الأساسيات (Basic Level) لبرنامج Exoplan',
        'طبيب أسنان أو اختصاصي زراعة أو جراحة فم وفكين',
        'يفضّل توفر ملفات حالات DICOM وSTL للتطبيق العملي',
      ],
      duration: '4 أيام',
      certificate: 'شهادة مشاركة (غير معتمدة)',
    },
    en: {
      title: 'Professional Exoplan Course (Advanced)',
      description:
        'An advanced professional program covering surgical guide design from single implants through All-on-4, All-on-6 and multi-layered stackable guides, plus the 3D printing workflow.',
      overview:
        'A four-day advanced course covering CBCT and oral scanner assessment, single and multiple tissue-supported guides, All-on-4 and All-on-6 guides, multi-layered stackable guides (two modules), and the 3D printing workflow. Prerequisite: completion of the Exoplan Basic Level course.',
      objectives: [
        'Assess CBCT scans and align them with digital impressions',
        'Design a single implant surgical guide',
        'Design tissue-supported guides for multiple implants',
        'Design All-on-4 and All-on-6 surgical guides',
        'Build multi-layered stackable guide systems',
        'Master the 3D printing workflow details',
      ],
      requirements: [
        'Completion of the Exoplan Basic Level course',
        'Dentist, implantologist or oral and maxillofacial professional',
        'DICOM and STL case files are recommended for hands-on practice',
      ],
      duration: '4 days',
      certificate: 'Participation certificate (not accredited)',
    },
    curriculum: [
      {
        title: 'تقييم وقراءة صور الأشعة ثلاثية الأبعاد ومطابقتها مع الطبعة الرقمية',
        description: 'تأسيس قراءة CBCT ومطابقة البيانات مع المسح الفموي قبل التصميم.',
        outcomes: ['تقييم CBCT', 'مطابقة DICOM وSTL', 'اعتماد جودة البيانات'],
        lessons: [
          {
            title: 'CBCT & Oral Scanner Assessment',
            description: 'تقييم جودة الأشعة والطبعة الرقمية والتحقق من جاهزية الحالة للتخطيط.',
            topics: ['CBCT assessment', 'Oral scanner', 'Data quality'],
            format: 'نظري + عملي',
          },
        ],
      },
      {
        title: 'تصميم الدليل الجراحي للزرعات المنفردة',
        description: 'Single Implant Surgical Guide من التخطيط حتى التصدير.',
        outcomes: ['تخطيط زرعة منفردة', 'تصميم دليل سنّي الدعم'],
        lessons: [
          {
            title: 'Single Implant Surgical Guide',
            description: 'تصميم دليل جراحي كامل لزرعة منفردة.',
            topics: ['Guide support', 'Sleeve selection', 'STL export'],
            format: 'Hands-on',
          },
        ],
      },
      {
        title: 'تصميم الدليل الجراحي للزرعات المتعددة (Tissue Supported)',
        description: 'Multiple Implants — أدلة مدعومة بالأنسجة.',
        outcomes: ['تصميم دليل متعدد الزرعات', 'تحسين الثبات النسيجي'],
        lessons: [
          {
            title: 'Multiple Implants (Tissue Supported) Surgical Guide',
            description: 'تصميم دليل للحالات المتعددة مع دعم الأنسجة وتثبيت مناسب.',
            topics: ['Tissue support', 'Multiple implants', 'Fixation'],
            format: 'Hands-on',
          },
        ],
      },
      {
        title: 'تصميم الدليل الجراحي لحالات All on 4',
        description: 'تخطيط وتصميم دليل جراحي لحالات All-on-4.',
        outcomes: ['تخطيط All-on-4', 'إدارة الزرعات المائلة'],
        lessons: [
          {
            title: 'All on 4 Surgical Guide',
            description: 'تصميم دليل القوس الكامل بأربع زرعات.',
            topics: ['Full-arch', 'Tilted implants', 'AP spread'],
            format: 'Advanced workshop',
          },
        ],
      },
      {
        title: 'تصميم الدليل الجراحي لحالات All on 6',
        description: 'تخطيط وتصميم دليل جراحي لحالات All-on-6.',
        outcomes: ['تخطيط All-on-6', 'التحكم بالتوازي عبر القوس'],
        lessons: [
          {
            title: 'All on 6 Surgical Guide',
            description: 'توزيع ست زرعات وتحقيق ثبات ودقة الدليل.',
            topics: ['Implant distribution', 'Parallelism', 'Guide rigidity'],
            format: 'Advanced workshop',
          },
        ],
      },
      {
        title: 'تصميم الدليل الجراحي متعددة الطبقات — الجزء الأول',
        description: 'Multi-Layered Stackable Guide — Module 1.',
        outcomes: ['تخطيط Bone Reduction', 'بناء Pin Fixation Guide'],
        lessons: [
          {
            title: 'Multi-Layered Stackable Guide (Module 1)',
            description: 'الجزء الأول من منظومة الأدلة متعددة الطبقات القابلة للتجميع.',
            topics: ['Bone reduction', 'Pin fixation', 'Stack planning'],
            format: 'Advanced hands-on',
          },
        ],
      },
      {
        title: 'تصميم الأدلة الجراحية متعددة الطبقات القابلة للتجميع — الجزء الثاني',
        description: 'Multi-Layered Stackable Guide — Module 2.',
        outcomes: ['تصميم Implant Placement Guide', 'ضبط تسلسل التجميع'],
        lessons: [
          {
            title: 'Multi-Layered Stackable Guide (Module 2)',
            description: 'استكمال المنظومة وربط طبقات الدليل بتسلسل سريري واضح.',
            topics: ['Implant placement guide', 'Stacking sequence', 'Verification'],
            format: 'Advanced hands-on',
          },
        ],
      },
      {
        title: 'مسار وتفاصيل الطباعة ثلاثية الأبعاد',
        description: '3D Printing Workflow من الملف حتى الدليل المطبوع.',
        outcomes: ['إعداد ملف الطباعة', 'تنفيذ مسار الطباعة والمعالجة'],
        lessons: [
          {
            title: '3D Printing Workflow',
            description: 'إعدادات التقطيع والاتجاه والدعامات والمعالجة اللاحقة.',
            topics: ['Slicing', 'Orientation', 'Supports', 'Post-processing'],
            format: 'Lab workflow',
          },
        ],
      },
    ],
  },
];

export const EXOPLAN_COURSE_SLUGS = exoplanCourses.map((c) => c.slug);

type FormFieldSeed = {
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string;
  placeholderEn?: string;
  type: FormFieldType;
  required: boolean;
  width: 'half' | 'full';
  options?: Array<{ ar: string; en: string; value: string }>;
};

const yesNoOptions = [
  { ar: 'نعم', en: 'Yes', value: 'yes' },
  { ar: 'لا', en: 'No', value: 'no' },
];

const exoplanFormFields: Record<string, FormFieldSeed[]> = {
  'exoplan-students-basic': [
    {
      key: 'fullName',
      labelAr: 'الاسم الثلاثي',
      labelEn: 'Full name (triple name)',
      placeholderAr: 'الاسم الثلاثي',
      placeholderEn: 'Full triple name',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'universityCollege',
      labelAr: 'الجامعة والكلية',
      labelEn: 'University and college',
      placeholderAr: 'اسم الجامعة والكلية',
      placeholderEn: 'University and college name',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'academicStage',
      labelAr: 'المرحلة الدراسية',
      labelEn: 'Academic stage/year',
      placeholderAr: 'مثلاً المرحلة الرابعة',
      placeholderEn: 'e.g. 4th year',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'phone',
      labelAr: 'رقم الواتساب',
      labelEn: 'WhatsApp number',
      placeholderAr: '07xxxxxxxxx',
      placeholderEn: '07xxxxxxxxx',
      type: FormFieldType.PHONE,
      required: true,
      width: 'half',
    },
    {
      key: 'email',
      labelAr: 'البريد الإلكتروني (الايميل)',
      labelEn: 'Email address',
      placeholderAr: 'name@email.com',
      placeholderEn: 'name@email.com',
      type: FormFieldType.EMAIL,
      required: true,
      width: 'half',
    },
    {
      key: 'discountCode',
      labelAr: 'كود الخصم',
      labelEn: 'Discount code',
      placeholderAr: 'اختياري',
      placeholderEn: 'Optional',
      type: FormFieldType.TEXT,
      required: false,
      width: 'half',
    },
  ],
  'exoplan-graduates-basic': [
    {
      key: 'fullName',
      labelAr: 'الاسم الثلاثي',
      labelEn: 'Full name (triple name)',
      placeholderAr: 'الاسم الثلاثي',
      placeholderEn: 'Full triple name',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'universityCollege',
      labelAr: 'الجامعة والكلية',
      labelEn: 'University and college',
      placeholderAr: 'اسم الجامعة والكلية',
      placeholderEn: 'University and college name',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'graduationYear',
      labelAr: 'سنة التخرج',
      labelEn: 'Graduation year',
      placeholderAr: 'مثلاً 2022',
      placeholderEn: 'e.g. 2022',
      type: FormFieldType.NUMBER,
      required: true,
      width: 'half',
    },
    {
      key: 'phone',
      labelAr: 'رقم الواتساب',
      labelEn: 'WhatsApp number',
      placeholderAr: '07xxxxxxxxx',
      placeholderEn: '07xxxxxxxxx',
      type: FormFieldType.PHONE,
      required: true,
      width: 'half',
    },
    {
      key: 'email',
      labelAr: 'البريد الإلكتروني (الايميل)',
      labelEn: 'Email address',
      placeholderAr: 'name@email.com',
      placeholderEn: 'name@email.com',
      type: FormFieldType.EMAIL,
      required: true,
      width: 'half',
    },
    {
      key: 'discountCode',
      labelAr: 'كود الخصم',
      labelEn: 'Discount code',
      placeholderAr: 'اختياري',
      placeholderEn: 'Optional',
      type: FormFieldType.TEXT,
      required: false,
      width: 'half',
    },
  ],
  'exoplan-professional-advanced': [
    {
      key: 'fullName',
      labelAr: 'الاسم الثلاثي',
      labelEn: 'Full name (triple name)',
      placeholderAr: 'الاسم الثلاثي',
      placeholderEn: 'Full triple name',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'universityCollege',
      labelAr: 'الجامعة والكلية',
      labelEn: 'University and college',
      placeholderAr: 'اسم الجامعة والكلية',
      placeholderEn: 'University and college name',
      type: FormFieldType.TEXT,
      required: true,
      width: 'half',
    },
    {
      key: 'graduationYear',
      labelAr: 'سنة التخرج',
      labelEn: 'Graduation year',
      placeholderAr: 'مثلاً 2022',
      placeholderEn: 'e.g. 2022',
      type: FormFieldType.NUMBER,
      required: true,
      width: 'half',
    },
    {
      key: 'phone',
      labelAr: 'رقم الواتساب',
      labelEn: 'WhatsApp number',
      placeholderAr: '07xxxxxxxxx',
      placeholderEn: '07xxxxxxxxx',
      type: FormFieldType.PHONE,
      required: true,
      width: 'half',
    },
    {
      key: 'email',
      labelAr: 'البريد الإلكتروني (الايميل)',
      labelEn: 'Email address',
      placeholderAr: 'name@email.com',
      placeholderEn: 'name@email.com',
      type: FormFieldType.EMAIL,
      required: true,
      width: 'half',
    },
    {
      key: 'previousCourse',
      labelAr: 'هل شاركت في كورس سابق؟',
      labelEn: 'Did you participate in a previous course?',
      type: FormFieldType.SELECT,
      required: true,
      width: 'half',
      options: yesNoOptions,
    },
    {
      key: 'previousOrg',
      labelAr: 'في حال الإجابة بـ (نعم)، يرجى ذكر الجهة التدريبية',
      labelEn: 'If yes, please name the training organization',
      placeholderAr: 'اسم الجهة التدريبية',
      placeholderEn: 'Training organization name',
      type: FormFieldType.TEXT,
      required: false,
      width: 'full',
    },
    {
      key: 'previousCertificate',
      labelAr: 'هل حصلت على شهادة من الكورس السابق؟',
      labelEn: 'Did you receive a certificate from the previous course?',
      type: FormFieldType.SELECT,
      required: true,
      width: 'half',
      options: yesNoOptions,
    },
  ],
};

async function syncCourseFormFields(
  prisma: PrismaClient,
  courseId: string,
  fields: FormFieldSeed[],
) {
  await prisma.courseFormField.deleteMany({ where: { courseId } });
  await prisma.courseFormField.createMany({
    data: fields.map((field, index) => ({
      courseId,
      key: field.key,
      labelAr: field.labelAr,
      labelEn: field.labelEn,
      placeholderAr: field.placeholderAr,
      placeholderEn: field.placeholderEn,
      type: field.type,
      required: field.required,
      width: field.width,
      sortOrder: index,
      options: (field.options ?? []) as Prisma.InputJsonValue,
    })),
  });
}

export async function seedExoplanCourses(prisma: PrismaClient, instructorIds: string[]) {
  const seededIds: string[] = [];

  for (const seed of exoplanCourses) {
    const course = await prisma.course.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.ar.title,
        description: seed.ar.description,
        overview: seed.ar.overview,
        objectives: seed.ar.objectives,
        requirements: seed.ar.requirements,
        duration: seed.ar.duration,
        level: seed.level,
        price: seed.price,
        currency: seed.currency,
        certificate: seed.ar.certificate,
        coverUrl: seed.coverUrl,
        registrationFormUrl: null,
        status: PublishStatus.PUBLISHED,
        sortOrder: seed.sortOrder,
      },
      create: {
        title: seed.ar.title,
        slug: seed.slug,
        coverUrl: seed.coverUrl,
        description: seed.ar.description,
        overview: seed.ar.overview,
        objectives: seed.ar.objectives,
        requirements: seed.ar.requirements,
        duration: seed.ar.duration,
        level: seed.level,
        price: seed.price,
        currency: seed.currency,
        certificate: seed.ar.certificate,
        status: PublishStatus.PUBLISHED,
        sortOrder: seed.sortOrder,
        instructors: {
          create: instructorIds.map((instructorId) => ({ instructorId })),
        },
        gallery: {
          create: [
            { url: COVER, alt: 'جلسة تدريب Exoplan', sortOrder: 0 },
            { url: COVER, alt: 'تخطيط زرعات', sortOrder: 1 },
            { url: COVER, alt: 'دليل جراحي', sortOrder: 2 },
          ],
        },
      },
    });

    seededIds.push(course.id);

    for (const instructorId of instructorIds) {
      const link = await prisma.courseInstructor.findUnique({
        where: {
          courseId_instructorId: { courseId: course.id, instructorId },
        },
      });
      if (!link) {
        await prisma.courseInstructor.create({
          data: { courseId: course.id, instructorId },
        });
      }
    }

    await prisma.courseInstructor.deleteMany({
      where: {
        courseId: course.id,
        instructorId: { notIn: instructorIds },
      },
    });

    const galleryCount = await prisma.courseGallery.count({ where: { courseId: course.id } });
    if (galleryCount < 3) {
      await prisma.courseGallery.deleteMany({ where: { courseId: course.id } });
      await prisma.courseGallery.createMany({
        data: [
          { courseId: course.id, url: COVER, alt: 'جلسة تدريب Exoplan', sortOrder: 0 },
          { courseId: course.id, url: COVER, alt: 'تخطيط زرعات', sortOrder: 1 },
          { courseId: course.id, url: COVER, alt: 'دليل جراحي', sortOrder: 2 },
        ],
      });
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.curriculumModule.deleteMany({ where: { courseId: course.id } });
        for (const [moduleIndex, module] of seed.curriculum.entries()) {
          await tx.curriculumModule.create({
            data: {
              courseId: course.id,
              title: module.title,
              description: module.description,
              outcomes: module.outcomes ?? [],
              sortOrder: moduleIndex,
              lessons: {
                create: module.lessons.map((lesson, lessonIndex) => ({
                  title: lesson.title,
                  description: lesson.description,
                  topics: lesson.topics ?? [],
                  format: lesson.format,
                  duration: lesson.duration,
                  sortOrder: lessonIndex,
                })),
              },
            },
          });
        }
      },
      { timeout: 120_000 },
    );

    await prisma.courseTranslation.upsert({
      where: { courseId_locale: { courseId: course.id, locale: 'ar' } },
      update: { ...seed.ar },
      create: { courseId: course.id, locale: 'ar', ...seed.ar },
    });

    await prisma.courseTranslation.upsert({
      where: { courseId_locale: { courseId: course.id, locale: 'en' } },
      update: { ...seed.en },
      create: { courseId: course.id, locale: 'en', ...seed.en },
    });

    const formFields = exoplanFormFields[seed.slug];
    if (formFields?.length) {
      await syncCourseFormFields(prisma, course.id, formFields);
    }
  }

  return seededIds;
}
