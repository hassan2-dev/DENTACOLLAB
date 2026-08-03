import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  amount: number;
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

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], { ar: string; en: string }> = {
  PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
  PAID: { ar: 'مدفوع', en: 'Paid' },
  FAILED: { ar: 'فشل', en: 'Failed' },
  CANCELLED: { ar: 'ملغى', en: 'Cancelled' },
  REFUNDED: { ar: 'مسترد', en: 'Refunded' },
};

function formatMoney(amount: number, currency: string, ar: boolean) {
  const formatted = amount.toLocaleString(ar ? 'ar-IQ' : 'en-US');
  return `${formatted} ${currency}`;
}

export function PaymentsAdminPage() {
  const { language } = useAdminPreferences();
  const ar = language === 'ar';
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);

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

  const rows = useMemo(() => query.data || [], [query.data]);

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
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelected(row)}>
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

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{selected.invoiceNumber}</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{selected.course.title}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                ✕
              </Button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                [ar ? 'الاسم' : 'Name', selected.fullName],
                [ar ? 'الهاتف' : 'Phone', selected.phone],
                [ar ? 'البريد' : 'Email', selected.email],
                [ar ? 'المبلغ' : 'Amount', formatMoney(selected.amount, selected.currency, ar)],
                [
                  ar ? 'الحالة' : 'Status',
                  STATUS_LABELS[selected.paymentStatus as (typeof STATUSES)[number]]?.[ar ? 'ar' : 'en'] ||
                    selected.paymentStatus,
                ],
                [ar ? 'المزوّد' : 'Provider', selected.provider],
                ['Stripe Session', selected.stripeSessionId || '—'],
                ['Payment Intent', selected.stripePaymentIntentId || '—'],
                [
                  ar ? 'تاريخ الدفع' : 'Paid at',
                  selected.paidAt ? new Date(selected.paidAt).toLocaleString(ar ? 'ar-IQ' : 'en-US') : '—',
                ],
                [
                  ar ? 'تاريخ الإنشاء' : 'Created',
                  new Date(selected.createdAt).toLocaleString(ar ? 'ar-IQ' : 'en-US'),
                ],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2">
                  <dt className="text-[var(--color-ink-muted)]">{label}</dt>
                  <dd className="max-w-[60%] text-end font-semibold break-all">{value}</dd>
                </div>
              ))}
            </dl>
            {selected.invoicePdfUrl ? (
              <a
                href={selected.invoicePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[var(--color-brand)] px-4 py-3 text-sm font-bold text-white"
              >
                {ar ? 'تحميل الفاتورة' : 'Download Invoice'}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
