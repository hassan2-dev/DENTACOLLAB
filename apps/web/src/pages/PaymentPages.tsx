import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useLocale } from '../lib/locale';
import { LogoLoader } from '../components/LogoLoader';

type PaymentView = {
  id: string;
  fullName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  invoicePdfUrl?: string | null;
  paidAt?: string | null;
  course: { id: string; title: string; slug: string };
};

function formatMoney(amount: number, currency: string, isAr: boolean) {
  const formatted = amount.toLocaleString(isAr ? 'ar-IQ' : 'en-US');
  if (currency.toUpperCase() === 'USD') return isAr ? `${formatted} $` : `$${formatted}`;
  if (currency.toUpperCase() === 'IQD') return isAr ? `${formatted} د.ع` : `${formatted} IQD`;
  return `${formatted} ${currency}`;
}

export function PaymentSuccessPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || '';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-session', sessionId],
    queryFn: () => api<PaymentView>(`/payments/session/${sessionId}`),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => (query.state.data?.paymentStatus === 'PAID' ? false : 2500),
    retry: 6,
  });

  if (!sessionId) {
    return (
      <div className="dc-container py-20 text-center">
        <p>{isAr ? 'جلسة الدفع غير موجودة.' : 'Payment session missing.'}</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-[#101c38] px-5 py-3 text-sm font-bold text-white">
          {isAr ? 'العودة للرئيسية' : 'Back to home'}
        </Link>
      </div>
    );
  }

  if (isLoading || (data && data.paymentStatus === 'PENDING')) {
    return (
      <LogoLoader
        fullPage
        label={
          isAr
            ? 'جاري تأكيد الدفع...'
            : 'Confirming your payment...'
        }
      />
    );
  }

  if (error || !data) {
    return (
      <div className="dc-container py-20 text-center">
        <p className="text-lg font-bold text-red-600">
          {isAr ? 'تعذر تأكيد الدفع حالياً' : 'Unable to confirm payment yet'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 rounded-full bg-[#1fb6d1] px-5 py-3 text-sm font-bold text-white"
        >
          {isAr ? 'إعادة المحاولة' : 'Try again'}
        </button>
      </div>
    );
  }

  if (data.paymentStatus === 'FAILED') {
    return <Navigate to="/payments/failed" replace />;
  }

  const copy = isAr
    ? {
        title: 'تم الدفع بنجاح',
        subtitle: 'شكراً لك — تم تأكيد تسجيلك في الدورة',
        student: 'اسم الطالب',
        course: 'الدورة',
        invoice: 'رقم الفاتورة',
        amount: 'المبلغ',
        download: 'تحميل الفاتورة',
        home: 'العودة للرئيسية',
      }
    : {
        title: 'Payment Successful',
        subtitle: 'Thank you — your course registration is confirmed',
        student: 'Student name',
        course: 'Course',
        invoice: 'Invoice number',
        amount: 'Amount',
        download: 'Download Invoice',
        home: 'Back To Home',
      };

  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-[radial-gradient(circle_at_top,#d9f6fc,transparent_42%),linear-gradient(180deg,#f7fbfe,#eef5fa)] py-16 dark:bg-[radial-gradient(circle_at_top,rgba(31,182,209,.18),transparent_40%),linear-gradient(180deg,#040b18,#071426)]">
      <Helmet>
        <title>{copy.title} | DentaCollab</title>
      </Helmet>
      <div className="dc-container">
        <div className="mx-auto max-w-lg rounded-[1.75rem] border border-white/80 bg-white/95 p-8 text-center shadow-[0_24px_80px_rgba(16,28,56,.12)] dark:border-[#19314f] dark:bg-[#081426]/95">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8f9fc] text-3xl text-[#0f8aa3] dark:bg-[#0b2850] dark:text-[#7be7ff]">
            ✓
          </div>
          <h1 className="mt-5 text-3xl font-black text-[#101c38] dark:text-white">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{copy.subtitle}</p>

          <dl className="mt-8 space-y-3 text-start text-sm">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8fafc] px-4 py-3 dark:bg-[#0b1a2e]">
              <dt className="text-slate-500">{copy.student}</dt>
              <dd className="font-bold text-[#101c38] dark:text-white">{data.fullName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8fafc] px-4 py-3 dark:bg-[#0b1a2e]">
              <dt className="text-slate-500">{copy.course}</dt>
              <dd className="font-bold text-[#101c38] dark:text-white">{data.course.title}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8fafc] px-4 py-3 dark:bg-[#0b1a2e]">
              <dt className="text-slate-500">{copy.invoice}</dt>
              <dd className="font-bold text-[#101c38] dark:text-white">{data.invoiceNumber}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8fafc] px-4 py-3 dark:bg-[#0b1a2e]">
              <dt className="text-slate-500">{copy.amount}</dt>
              <dd className="font-bold text-[#1fb6d1]">
                {formatMoney(data.amount, data.currency, isAr)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {data.invoicePdfUrl ? (
              <a
                href={data.invoicePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#101c38] to-[#1fb6d1] px-6 py-3.5 text-sm font-bold text-white"
              >
                {copy.download}
              </a>
            ) : null}
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#101c38] dark:border-[#19314f] dark:bg-transparent dark:text-white"
            >
              {copy.home}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentFailedPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  return (
    <div className="dc-container py-20">
      <Helmet>
        <title>{isAr ? 'فشل الدفع' : 'Payment Failed'} | DentaCollab</title>
      </Helmet>
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-red-100 bg-white p-8 text-center shadow-lg dark:border-red-900/40 dark:bg-[#081426]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-3xl text-red-600 dark:bg-red-950/40">
          !
        </div>
        <h1 className="mt-5 text-3xl font-black text-[#101c38] dark:text-white">
          {isAr ? 'فشل الدفع' : 'Payment Failed'}
        </h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {isAr
            ? 'لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى.'
            : 'The payment could not be completed. You can try again.'}
        </p>
        <Link
          to="/courses"
          className="mt-8 inline-flex rounded-full bg-[#1fb6d1] px-6 py-3.5 text-sm font-bold text-white"
        >
          {isAr ? 'حاول مرة أخرى' : 'Try Again'}
        </Link>
      </div>
    </div>
  );
}

export function PaymentCancelPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [params] = useSearchParams();
  const courseSlug = params.get('course') || '';
  const paymentId = params.get('payment_id') || '';

  useQuery({
    queryKey: ['cancel-payment', paymentId],
    queryFn: () =>
      api(`/payments/${paymentId}/cancel`, { method: 'POST', body: '{}' }),
    enabled: Boolean(paymentId),
    retry: false,
  });

  return (
    <div className="dc-container py-20">
      <Helmet>
        <title>{isAr ? 'تم إلغاء الدفع' : 'Payment Cancelled'} | DentaCollab</title>
      </Helmet>
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-slate-100 bg-white p-8 text-center shadow-lg dark:border-[#19314f] dark:bg-[#081426]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-3xl text-slate-500 dark:bg-[#0b1a2e]">
          ×
        </div>
        <h1 className="mt-5 text-3xl font-black text-[#101c38] dark:text-white">
          {isAr ? 'تم إلغاء الدفع' : 'Payment Cancelled'}
        </h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {isAr
            ? 'ألغيت عملية الدفع. يمكنك الرجوع للدورة والمحاولة لاحقاً.'
            : 'You cancelled the payment. You can return to the course and try later.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {courseSlug ? (
            <Link
              to={`/courses/${courseSlug}`}
              className="inline-flex rounded-full bg-[#1fb6d1] px-6 py-3.5 text-sm font-bold text-white"
            >
              {isAr ? 'العودة للدورة' : 'Back to course'}
            </Link>
          ) : null}
          <Link
            to="/"
            className="inline-flex rounded-full border border-slate-200 px-6 py-3.5 text-sm font-bold text-[#101c38] dark:border-[#19314f] dark:text-white"
          >
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
