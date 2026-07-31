import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Input, Select } from '@dentacollab/ui';
import { API_URL, api, getToken } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
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
  course: { title: string };
};

const STATUSES = ['NEW', 'CONTACTED', 'CONFIRMED', 'REJECTED', 'COMPLETED'] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], { ar: string; en: string }> = {
  NEW: { ar: 'جديد', en: 'New' },
  CONTACTED: { ar: 'تم التواصل', en: 'Contacted' },
  CONFIRMED: { ar: 'مؤكد', en: 'Confirmed' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  COMPLETED: { ar: 'مكتمل', en: 'Completed' },
};

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

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/registrations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registrations'] });
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
      <div className="overflow-auto rounded-2xl border border-[var(--color-border)] bg-white">
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
                    <div className="font-semibold text-[var(--color-brand-dark)] underline-offset-2 hover:underline">
                      {r.fullName}
                    </div>
                    <div className="text-xs text-[var(--color-ink-muted)]">
                      {r.city} · {r.occupation}
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
          <div className="admin-popup-panel">
            <div className="admin-popup-head">
              <div>
                <h3 className="text-lg font-black">{selected.fullName}</h3>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{selected.course.title}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setSelected(null)}>
                {ar ? 'إغلاق' : 'Close'}
              </Button>
            </div>
            <div className="admin-popup-body space-y-2">
              {Object.entries(
                selected.answers && Object.keys(selected.answers).length
                  ? selected.answers
                  : {
                      fullName: selected.fullName,
                      phone: selected.phone,
                      email: selected.email,
                      city: selected.city,
                      occupation: selected.occupation,
                      experience: selected.experience,
                      notes: selected.notes || '',
                    },
              ).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-muted)]">{key}</span>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
