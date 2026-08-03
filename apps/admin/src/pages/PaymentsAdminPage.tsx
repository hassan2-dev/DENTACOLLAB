import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input, Select } from '@dentacollab/ui';
import { API_URL, api, getToken } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { notify } from '../lib/toast';

type Payment = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  invoiceNumber: string;
  registrationNumber?: string | null;
  amount: number;
  discountAmount?: number | null;
  couponCode?: string | null;
  currency: string;
  paymentStatus: string;
  provider: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  invoicePdfUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  course: { id: string; title: string; slug: string };
  registration?: { id: string; status: string } | null;
};

type TimelineStep = {
  key: string;
  label: string;
  at?: string | Date | null;
  done: boolean;
};

type PaymentLog = {
  id?: string;
  event: string;
  status: string;
  createdAt: string;
  payload?: unknown;
};

type PaymentDetail = Payment & {
  timeline?: {
    steps: TimelineStep[];
    logs?: PaymentLog[];
  };
  logs?: PaymentLog[];
};

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], { ar: string; en: string }> = {
  PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
  PAID: { ar: 'مدفوع', en: 'Paid' },
  FAILED: { ar: 'فشل', en: 'Failed' },
  CANCELLED: { ar: 'ملغى', en: 'Cancelled' },
  REFUNDED: { ar: 'مسترد', en: 'Refunded' },
};

const STEP_LABELS: Record<string, { ar: string; en: string }> = {
  CREATED: { ar: 'تم الإنشاء', en: 'Created' },
  WAITING_PAYMENT: { ar: 'بانتظار الدفع', en: 'Waiting Payment' },
  PAID: { ar: 'مدفوع', en: 'Paid' },
  INVOICE_GENERATED: { ar: 'تم إنشاء الفاتورة', en: 'Invoice Generated' },
  EMAIL_SENT: { ar: 'تم إرسال البريد', en: 'Email Sent' },
  REFUNDED: { ar: 'مسترد', en: 'Refunded' },
};

function formatMoney(amount: number, currency: string, ar: boolean) {
  const formatted = amount.toLocaleString(ar ? 'ar-IQ' : 'en-US');
  return `${formatted} ${currency}`;
}

function formatDate(value?: string | Date | null, ar?: boolean) {
  if (!value) return '—';
  return new Date(value).toLocaleString(ar ? 'ar-IQ' : 'en-US');
}

export function PaymentsAdminPage() {
  const { language } = useAdminPreferences();
  const ar = language === 'ar';
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin-payments', q, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const qs = params.toString();
      return api<Payment[]>(`/payments${qs ? `?${qs}` : ''}`);
    },
  });

  const detailQuery = useQuery({
    queryKey: ['admin-payment', selectedId],
    queryFn: () => api<PaymentDetail>(`/payments/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  const refund = useMutation({
    mutationFn: (id: string) => api(`/payments/${id}/refund`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      qc.invalidateQueries({ queryKey: ['admin-payment', selectedId] });
      notify.success(ar ? 'تم استرداد الدفعة' : 'Payment refunded');
    },
    onError: (err: Error) => {
      notify.error(err.message || (ar ? 'فشل الاسترداد' : 'Refund failed'));
    },
  });

  const rows = useMemo(() => query.data || [], [query.data]);
  const selected = detailQuery.data;
  const steps = selected?.timeline?.steps || [];
  const logs = selected?.timeline?.logs || selected?.logs || [];

  async function exportExcel() {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const qs = params.toString();
      const token = getToken();
      const res = await fetch(`${API_URL}/payments/export${qs ? `?${qs}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      notify.success(ar ? 'تم التصدير' : 'Exported');
    } catch {
      notify.error(ar ? 'فشل التصدير' : 'Export failed');
    }
  }

  function confirmRefund() {
    if (!selectedId || !selected) return;
    const ok = window.confirm(
      ar
        ? `تأكيد استرداد دفعة ${selected.invoiceNumber}؟`
        : `Refund payment ${selected.invoiceNumber}?`,
    );
    if (ok) refund.mutate(selectedId);
  }

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-brand)]">
            {ar ? 'المالية' : 'Finance'}
          </p>
          <h1 className="mt-1 text-2xl font-black text-[var(--color-ink)]">
            {ar ? 'المدفوعات' : 'Payments'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {ar
              ? 'ابحث بالاسم أو الهاتف أو البريد أو رقم الفاتورة'
              : 'Search by name, phone, email, or invoice number'}
          </p>
        </div>
        <Button type="button" onClick={exportExcel}>
          {ar ? 'تصدير Excel' : 'Export Excel'}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input
          id="payment-search"
          label={ar ? 'بحث' : 'Search'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={ar ? 'اسم / هاتف / بريد / فاتورة' : 'Name / phone / email / invoice'}
        />
        <Select
          id="payment-status"
          label={ar ? 'الحالة' : 'Status'}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{ar ? 'الكل' : 'All'}</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item][ar ? 'ar' : 'en']}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-start">
            <tr>
              <th className="px-4 py-3 font-bold">{ar ? 'الفاتورة' : 'Invoice'}</th>
              <th className="px-4 py-3 font-bold">{ar ? 'الطالب' : 'Student'}</th>
              <th className="px-4 py-3 font-bold">{ar ? 'الدورة' : 'Course'}</th>
              <th className="px-4 py-3 font-bold">{ar ? 'المبلغ' : 'Amount'}</th>
              <th className="px-4 py-3 font-bold">{ar ? 'الحالة' : 'Status'}</th>
              <th className="px-4 py-3 font-bold">{ar ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-muted)]">
                  {ar ? 'جاري التحميل...' : 'Loading...'}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-muted)]">
                  {ar ? 'لا توجد مدفوعات' : 'No payments found'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-semibold">{row.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.fullName}</div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{row.email}</div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{row.phone}</div>
                  </td>
                  <td className="px-4 py-3">{row.course.title}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatMoney(row.amount, row.currency, ar)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-chip status-${row.paymentStatus.toLowerCase()}`}>
                      {STATUS_LABELS[row.paymentStatus as (typeof STATUSES)[number]]?.[ar ? 'ar' : 'en'] ||
                        row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(row.id)}>
                        {ar ? 'عرض' : 'View'}
                      </Button>
                      {row.invoicePdfUrl ? (
                        <a
                          href={row.invoicePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center rounded-md border border-[var(--color-border)] px-3 text-xs font-bold"
                        >
                          {ar ? 'الفاتورة' : 'Invoice'}
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSelectedId(null)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">
                  {selected?.invoiceNumber || (ar ? 'تفاصيل الدفعة' : 'Payment details')}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  {selected?.course.title || (detailQuery.isLoading ? (ar ? 'جاري التحميل...' : 'Loading...') : '')}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
                ✕
              </Button>
            </div>

            {detailQuery.isLoading || !selected ? (
              <p className="mt-8 text-center text-sm text-[var(--color-ink-muted)]">
                {ar ? 'جاري التحميل...' : 'Loading...'}
              </p>
            ) : (
              <>
                <dl className="mt-5 space-y-3 text-sm">
                  {[
                    [ar ? 'الاسم' : 'Name', selected.fullName],
                    [ar ? 'الهاتف' : 'Phone', selected.phone],
                    [ar ? 'البريد' : 'Email', selected.email],
                    [ar ? 'رقم التسجيل' : 'Registration #', selected.registrationNumber || '—'],
                    [ar ? 'المبلغ' : 'Amount', formatMoney(selected.amount, selected.currency, ar)],
                    [
                      ar ? 'الخصم' : 'Discount',
                      selected.discountAmount
                        ? formatMoney(selected.discountAmount, selected.currency, ar)
                        : '—',
                    ],
                    [ar ? 'كود الخصم' : 'Coupon', selected.couponCode || '—'],
                    [
                      ar ? 'الحالة' : 'Status',
                      STATUS_LABELS[selected.paymentStatus as (typeof STATUSES)[number]]?.[ar ? 'ar' : 'en'] ||
                        selected.paymentStatus,
                    ],
                    [ar ? 'المزوّد' : 'Provider', selected.provider],
                    ['Stripe Session', selected.stripeSessionId || '—'],
                    ['Payment Intent', selected.stripePaymentIntentId || '—'],
                    [ar ? 'تاريخ الدفع' : 'Paid at', formatDate(selected.paidAt, ar)],
                    [ar ? 'تاريخ الإنشاء' : 'Created', formatDate(selected.createdAt, ar)],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2"
                    >
                      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
                      <dd className="max-w-[60%] text-end font-semibold break-all">{value}</dd>
                    </div>
                  ))}
                </dl>

                <section className="mt-6">
                  <h3 className="text-sm font-black">{ar ? 'مسار الدفع' : 'Payment Timeline'}</h3>
                  <ol className="mt-3 space-y-2">
                    {steps.map((step, index) => (
                      <li
                        key={step.key}
                        className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5"
                      >
                        <span
                          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-black ${
                            step.done
                              ? 'bg-[var(--color-brand)] text-white'
                              : 'bg-[var(--color-surface)] text-[var(--color-ink-muted)]'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">
                            {STEP_LABELS[step.key]?.[ar ? 'ar' : 'en'] || step.label}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)]">
                            {step.done ? formatDate(step.at, ar) : ar ? 'لم يكتمل بعد' : 'Pending'}
                          </p>
                        </div>
                      </li>
                    ))}
                    {!steps.length ? (
                      <p className="text-sm text-[var(--color-ink-muted)]">
                        {ar ? 'لا يوجد مسار بعد' : 'No timeline yet'}
                      </p>
                    ) : null}
                  </ol>
                </section>

                {logs.length ? (
                  <section className="mt-6">
                    <h3 className="text-sm font-black">{ar ? 'سجل الأحداث' : 'Payment logs'}</h3>
                    <ul className="mt-3 space-y-2">
                      {logs.map((log, index) => (
                        <li
                          key={log.id || `${log.event}-${log.createdAt}-${index}`}
                          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong>{log.event}</strong>
                            <span className="text-xs text-[var(--color-ink-muted)]">
                              {formatDate(log.createdAt, ar)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{log.status}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2">
                  {selected.invoicePdfUrl ? (
                    <a
                      href={selected.invoicePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-brand)] px-4 py-3 text-sm font-bold text-white"
                    >
                      {ar ? 'تحميل الفاتورة' : 'Download Invoice'}
                    </a>
                  ) : null}
                  {selected.paymentStatus === 'PAID' ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1 rounded-full"
                      disabled={refund.isPending}
                      onClick={confirmRefund}
                    >
                      {refund.isPending
                        ? ar
                          ? 'جاري الاسترداد...'
                          : 'Refunding...'
                        : ar
                          ? 'استرداد الدفعة'
                          : 'Refund Payment'}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
