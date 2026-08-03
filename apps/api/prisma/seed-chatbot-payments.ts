/**
 * Payment / invoice FAQ entries for the chatbot.
 * Safe to re-run: upserts by matching questionAr.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PAYMENT_CHATBOT_QAS = [
  {
    questionAr: 'كيف أدفع رسوم الدورة؟',
    answerAr:
      'بعد تعبئة نموذج التسجيل على صفحة الدورة، يتم توجيهك لبوابة الدفع الآمنة (Stripe). بعد إتمام الدفع بنجاح يصلك إيميل تأكيد من DentaCollab مع رقم الفاتورة ورابط تحميل الـ PDF. إذا واجهت مشكلة أثناء الدفع، تواصل مع الدعم عبر واتساب.',
    questionEn: 'How do I pay for a course?',
    answerEn:
      'After filling the registration form on the course page, you are redirected to our secure Stripe checkout. Once payment succeeds, you receive a confirmation email from DentaCollab with your invoice number and a PDF download link. If anything fails during payment, contact support on WhatsApp.',
    sortOrder: 20,
  },
  {
    questionAr: 'وين إيميل تأكيد الدفع؟',
    answerAr:
      'بعد الدفع الناجح نرسل إيميل تأكيد من DentaCollab يحتوي على: اسم الدورة، رقم الفاتورة، المبلغ، وزر «تحميل الفاتورة». تحقق من الوارد ومجلد الرسائل غير المرغوب فيها (Spam). إذا لم يصلك الإيميل خلال دقائق، راسل الدعم عبر واتساب مع اسمك ورقم هاتفك.',
    questionEn: 'Where is my payment confirmation email?',
    answerEn:
      'After a successful payment we send a DentaCollab confirmation email with: course name, invoice number, amount, and a Download Invoice button. Check Inbox and Spam. If it does not arrive within a few minutes, contact WhatsApp support with your name and phone number.',
    sortOrder: 21,
  },
  {
    questionAr: 'كيف أحمل الفاتورة PDF؟',
    answerAr:
      'من إيميل تأكيد الدفع اضغط زر «تحميل الفاتورة (Download Invoice)». الفاتورة ملف PDF فيه اسمك، الدورة، رقم الفاتورة، المبلغ، وحالة الدفع. إذا انتهت صلاحية الرابط أو لم يظهر الزر، تواصل مع الدعم عبر واتساب وسنعيد إرسال الفاتورة.',
    questionEn: 'How do I download the invoice PDF?',
    answerEn:
      'Open the payment confirmation email and tap «Download Invoice». The PDF includes your name, course, invoice number, amount, and payment status. If the link is missing or expired, contact WhatsApp support and we will resend the invoice.',
    sortOrder: 22,
  },
  {
    questionAr: 'ما معنى رمز QR على الفاتورة؟',
    answerAr:
      'رمز QR على الفاتورة يفتح صفحة تأكيد الدفع على موقع DentaCollab (dentacollab.org) للتحقق من العملية. هذا جزء طبيعي من الفاتورة وليس خطأ. إذا الرابط لا يفتح أو يظهر خطأ، تواصل مع الدعم عبر واتساب وأرفق صورة الفاتورة.',
    questionEn: 'What does the QR code on the invoice mean?',
    answerEn:
      'The QR code on the invoice opens the payment confirmation page on dentacollab.org so you can verify the transaction. This is expected—not an error. If the link fails to open, contact WhatsApp support and attach a photo of the invoice.',
    sortOrder: 23,
  },
  {
    questionAr: 'رقم الفاتورة وين أجده؟',
    answerAr:
      'رقم الفاتورة يظهر في إيميل تأكيد الدفع وفي ملف الـ PDF (مثال: INV-20260803-0001). احتفظ به عند التواصل مع الدعم. لأي استفسار عن فاتورة أو دفع، راسلنا على واتساب مع رقم الفاتورة.',
    questionEn: 'Where can I find my invoice number?',
    answerEn:
      'Your invoice number appears in the payment confirmation email and on the PDF (e.g. INV-20260803-0001). Keep it handy when contacting support. For any invoice or payment question, message us on WhatsApp with that number.',
    sortOrder: 24,
  },
  {
    questionAr: 'دفعت بس ما انسجلت؟',
    answerAr:
      'عادةً بعد الدفع الناجح يتم تأكيد التسجيل تلقائياً ويصلك إيميل مع الفاتورة. إذا تم خصم المبلغ ولم يصلك تأكيد، لا تقلق—تواصل فوراً مع الدعم عبر واتساب وأرسل: اسمك، الإيميل، ورقم العملية أو الفاتورة إن وُجد، وسنراجع الحالة ونساعدك.',
    questionEn: 'I paid but my registration was not confirmed?',
    answerEn:
      'Successful payments normally confirm registration automatically and trigger the invoice email. If you were charged but did not get confirmation, contact WhatsApp support right away with your name, email, and payment/invoice reference—we will review and help.',
    sortOrder: 25,
  },
  {
    questionAr: 'هل الفاتورة بالعربي؟',
    answerAr:
      'نعم، فاتورة PDF تدعم الأسماء وعناوين الدورات بالعربية والإنجليزية. الإيميل أيضاً يصل بالعربية مع تنسيق واضح وزر تحميل. إذا ظهر نص غير مفهوم في الملف، أرسله للدعم عبر واتساب لنراجع نسختك.',
    questionEn: 'Is the invoice in Arabic?',
    answerEn:
      'Yes—the PDF invoice supports Arabic and English names and course titles. The email is also sent in Arabic with a clear layout and download button. If any text looks broken in your file, send it to WhatsApp support so we can check.',
    sortOrder: 26,
  },
  {
    questionAr: 'مشكلة في الدفع أو الفاتورة',
    answerAr:
      'لأي مشكلة تتعلق بالدفع، الإيميل، أو الفاتورة: راسل دعم DentaCollab عبر واتساب مع اسمك الكامل ورقم الهاتف ورقم الفاتورة إن وجد. الفريق يساعدك مباشرة—لا تحتاج تعيد الدفع قبل ما تتواصل معنا.',
    questionEn: 'Payment or invoice problem',
    answerEn:
      'For any payment, email, or invoice issue: message DentaCollab support on WhatsApp with your full name, phone, and invoice number if you have it. The team will help directly—do not pay again before contacting us.',
    sortOrder: 27,
  },
];

export async function seedPaymentChatbotQas(client: PrismaClient = prisma) {
  for (const qa of PAYMENT_CHATBOT_QAS) {
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

  await client.setting.upsert({
    where: { key: 'chatbot' },
    create: {
      key: 'chatbot',
      value: {
        welcomeAr:
          'مرحباً بك في DentaCollab. اسألني عن الدورات، الورش، التسجيل، الدفع، أو الفواتير.',
        welcomeEn:
          'Welcome to DentaCollab. Ask me about courses, workshops, registration, payments, or invoices.',
        goodbyeAr: 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!',
        goodbyeEn: 'Thanks for chatting with us. Have a great day!',
        outOfScopeAr:
          'عذراً، ما عندي جواب جاهز لهذا السؤال. لأمور الدفع أو الفواتير أو أي استفسار آخر، تواصل مع الدعم عبر واتساب وسنساعدك.',
        outOfScopeEn:
          'Sorry, I do not have a ready answer for that. For payments, invoices, or anything else, reach support on WhatsApp and we will help.',
      },
    },
    update: {
      value: {
        welcomeAr:
          'مرحباً بك في DentaCollab. اسألني عن الدورات، الورش، التسجيل، الدفع، أو الفواتير.',
        welcomeEn:
          'Welcome to DentaCollab. Ask me about courses, workshops, registration, payments, or invoices.',
        goodbyeAr: 'شكراً لتواصلك معنا. نتمنى لك يوماً سعيداً!',
        goodbyeEn: 'Thanks for chatting with us. Have a great day!',
        outOfScopeAr:
          'عذراً، ما عندي جواب جاهز لهذا السؤال. لأمور الدفع أو الفواتير أو أي استفسار آخر، تواصل مع الدعم عبر واتساب وسنساعدك.',
        outOfScopeEn:
          'Sorry, I do not have a ready answer for that. For payments, invoices, or anything else, reach support on WhatsApp and we will help.',
      },
    },
  });

  return PAYMENT_CHATBOT_QAS.length;
}

async function main() {
  const count = await seedPaymentChatbotQas();
  console.log(`Upserted ${count} payment chatbot Q&As + chatbot settings`);
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
