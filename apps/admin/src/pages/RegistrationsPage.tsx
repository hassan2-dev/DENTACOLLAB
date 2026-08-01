import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Input, Select } from '@dentacollab/ui';
import { API_URL, api, getToken } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { notify } from '../lib/toast';

type Registration = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  occupation: string;
  experience: string;
  notes?: string | null;
  answers?: Record<string, string> | null;
  status: string;
  createdAt: string;
  course: { id: string; title: string };
};

type FormField = {
  key: string;
  labelAr: string;
  labelEn: string;
  sortOrder: number;
};

const STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'COMPLETED'] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], { ar: string; en: string }> = {
  NEW: { ar: 'جديد', en: 'New' },
  CONTACTED: { ar: 'تم التواصل', en: 'Contacted' },
  CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  COMPLETED: { ar: 'مكتمل', en: 'Completed' },
};

const FALLBACK_LABELS: Record<string, { ar: string; en: string }> = {
  fullName: { ar: 'الاسم', en: 'Full name' },
  phone: { ar: 'رقم الواتساب', en: 'WhatsApp' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  city: { ar: 'المدينة', en: 'City' },
  occupation: { ar: 'المهنة', en: 'Occupation' },
  experience: { ar: 'الخبرة', en: 'Experience' },
  notes: { ar: 'ملاحظات', en: 'Notes' },
  university: { ar: 'الجامعة والكلية', en: 'University' },
  graduationYear: { ar: 'سنة التخرج', en: 'Graduation year' },
  academicStage: { ar: 'المرحلة الدراسية', en: 'Academic stage' },
  discountCode: { ar: 'كود الخصم', en: 'Discount code' },
};

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function buildDetailRows(
  reg: Registration,
  fields: FormField[] | undefined,
  ar: boolean,
): Array<{ key: string; label: string; value: string }> {
  const answers: Record<string, string> =
    reg.answers && Object.keys(reg.answers).length
      ? { ...reg.answers }
      : {
          fullName: reg.fullName,
          phone: reg.phone,
          email: reg.email,
          city: reg.city,
          occupation: reg.occupation,
          experience: reg.experience,
          notes: reg.notes || '',
        };

  // Ensure core columns always visible even if missing from answers
  if (!answers.fullName) answers.fullName = reg.fullName;
  if (!answers.phone) answers.phone = reg.phone;
  if (!answers.email) answers.email = reg.email;

  const labelFor = (key: string) => {
    const field = fields?.find((f) => f.key === key);
    if (field) return ar ? field.labelAr : field.labelEn;
    const fallback = FALLBACK_LABELS[key];
    if (fallback) return ar ? fallback.ar : fallback.en;
    return humanizeKey(key);
  };

  const orderedKeys: string[] = [];
  if (fields?.length) {
    for (const f of [...fields].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (f.key in answers) orderedKeys.push(f.key);
    }
  }
  for (const key of Object.keys(answers)) {
    if (!orderedKeys.includes(key)) orderedKeys.push(key);
  }

  return orderedKeys
    .map((key) => ({
      key,
      label: labelFor(key),
      value: (answers[key] || '').trim(),
    }))
    .filter((row) => row.value);
}

export function RegistrationsPage() {
  const { language } = useAdminPreferences();
  const ar = language === 'ar';
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);
  const { data } = useQuery({
    queryKey: ['registrations', q, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      return api<Registration[]>(`/registrations?${params}`);
    },
  });

  const formFields = useQuery({
    queryKey: ['course-form-fields', selected?.course.id],
    queryFn: () => api<FormField[]>(`/courses/${selected!.course.id}/form-fields`),
    enabled: Boolean(selected?.course.id),
  });

  const detailRows = useMemo(() => {
    if (!selected) return [];
    return buildDetailRows(selected, formFields.data, ar);
  }, [selected, formFields.data, ar]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/registrations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['registrations'] });
      setSelected((prev) => (prev && prev.id === vars.id ? { ...prev, status: vars.status } : prev));
      notify.success(ar ? 'تم تحديث الحالة' : 'Status updated');
    },
    onError: () => notify.error(ar ? 'فشل التحديث' : 'Update failed'),
  });

  async function exportExcel() {
    const res = await fetch(`${API_URL}/registrations/export/excel`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  function labelOf(s: string) {
    return STATUS_LABELS[s as (typeof STATUSES)[number]]?.[ar ? 'ar' : 'en'] || s;
  }

  return (
    <div className="admin-page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{ar ? 'التسجيلات' : 'Registrations'}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {ar ? 'طلبات التسجيل من فورم الدورات' : 'Course registration form submissions'}
          </p>
        </div>
        <Button onClick={exportExcel}>{ar ? 'تصدير Excel' : 'Export Excel'}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          id="q"
          label={ar ? 'بحث' : 'Search'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          id="status"
          label={ar ? 'الحالة' : 'Status'}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{ar ? 'الكل' : 'All'}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {labelOf(s)}
            </option>
          ))}
        </Select>
      </div>
      <div className="overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <table className="dc-table">
          <thead>
            <tr>
              <th>{ar ? 'الاسم' : 'Name'}</th>
              <th>{ar ? 'الدورة' : 'Course'}</th>
              <th>{ar ? 'التواصل' : 'Contact'}</th>
              <th>{ar ? 'الحالة' : 'Status'}</th>
              <th>{ar ? 'تغيير' : 'Change'}</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((r) => (
              <tr key={r.id}>
                <td>
                  <button type="button" className="text-start" onClick={() => setSelected(r)}>
                    <div className="font-semibold text-[var(--color-brand)] underline-offset-2 hover:underline">
                      {r.fullName}
                    </div>
                    <div className="text-xs text-[var(--color-ink-muted)]">
                      {r.city}
                      {r.occupation ? ` · ${r.occupation}` : ''}
                    </div>
                  </button>
                </td>
                <td>{r.course.title}</td>
                <td className="text-sm">
                  {r.phone}
                  <br />
                  {r.email}
                </td>
                <td>
                  <span className="status-chip status-draft">{labelOf(r.status)}</span>
                </td>
                <td>
                  <select
                    className="dc-select min-w-0 max-w-[10.5rem]"
                    value={r.status}
                    onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {labelOf(s)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length ? (
          <p className="py-10 text-center text-sm text-[var(--color-ink-muted)]">
            {ar ? 'لا توجد تسجيلات' : 'No registrations'}
          </p>
        ) : null}
      </div>

      {selected ? (
        <div className="admin-popup-root" role="dialog" aria-modal="true">
          <button type="button" className="admin-popup-backdrop" aria-label="Close" onClick={() => setSelected(null)} />
          <div className="admin-popup-panel reg-detail-panel">
            <div className="admin-popup-head">
              <div>
                <p className="reg-detail-eyebrow">{ar ? 'تفاصيل الطلب' : 'Application details'}</p>
                <h3>{selected.fullName}</h3>
                <p className="reg-detail-course">{selected.course.title}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setSelected(null)}>
                {ar ? 'إغلاق' : 'Close'}
              </Button>
            </div>

            <div className="admin-popup-body">
              <div className="reg-detail-meta">
                <div>
                  <span>{ar ? 'الحالة' : 'Status'}</span>
                  <strong>{labelOf(selected.status)}</strong>
                </div>
                <div>
                  <span>{ar ? 'تاريخ الطلب' : 'Submitted'}</span>
                  <strong>
                    {new Date(selected.createdAt).toLocaleString(ar ? 'ar-IQ' : 'en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </strong>
                </div>
              </div>

              <div className="reg-detail-status">
                <label htmlFor="reg-status">{ar ? 'تغيير الحالة' : 'Change status'}</label>
                <select
                  id="reg-status"
                  className="dc-select"
                  value={selected.status}
                  onChange={(e) => updateStatus.mutate({ id: selected.id, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {labelOf(s)}
                    </option>
                  ))}
                </select>
              </div>

              {formFields.isLoading ? (
                <p className="reg-detail-loading">{ar ? 'جاري تحميل الإجابات...' : 'Loading answers...'}</p>
              ) : (
                <dl className="reg-detail-list">
                  {detailRows.map((row) => (
                    <div key={row.key} className="reg-detail-row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
