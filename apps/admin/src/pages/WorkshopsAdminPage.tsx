import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Input, Textarea } from '@dentacollab/ui';
import { api } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { LocalePill, PageHeader } from '../components/AdminUi';
import { MediaImageField } from '../components/MediaImageField';
import { Button } from '../components/ui/button';
import { filterArabicOnly, filterEnglishOnly } from '../lib/bilingual';
import { notify } from '../lib/toast';

type Workshop = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  coverUrl?: string | null;
  presenterAr?: string | null;
  presenterEn?: string | null;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  isFeatured: boolean;
};

const empty = {
  title: '',
  titleEn: '',
  slug: '',
  description: '',
  descriptionEn: '',
  coverUrl: '',
  presenterAr: '',
  presenterEn: '',
  startsAt: '',
  endsAt: '',
  isPublished: false,
  isFeatured: false,
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function workshopPublicUrl(slug: string) {
  const site =
    (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':5173') : '');
  return `${site.replace(/\/$/, '')}/workshops/${slug}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CalendarAdminPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-calendar'],
    queryFn: () => api<Workshop[]>('/calendar/admin/all'),
  });
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugLocked, setSlugLocked] = useState(false);
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);

  const now = Date.now();
  const rows = useMemo(() => data || [], [data]);

  const save = useMutation({
    mutationFn: async () => {
      const autoSlug = form.slug.trim() || slugify(form.titleEn) || slugify(form.title);
      if (!form.title.trim() || !form.titleEn.trim() || !autoSlug || !form.startsAt || !form.endsAt) {
        throw new Error(isAr ? 'العنوان باللغتين والتواريخ مطلوبة' : 'AR/EN titles and dates are required');
      }
      if (!form.presenterAr.trim() || !form.presenterEn.trim()) {
        throw new Error(isAr ? 'مقدّم الورشة باللغتين مطلوب' : 'Workshop presenter is required in both languages');
      }
      const payload = {
        title: form.title.trim(),
        titleEn: form.titleEn.trim(),
        slug: autoSlug,
        description: form.description.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
        presenterAr: form.presenterAr.trim(),
        presenterEn: form.presenterEn.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
      };
      if (editingId) return api<Workshop>(`/calendar/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      return api<Workshop>('/calendar', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: async (saved) => {
      const wasEdit = Boolean(editingId);
      const url = workshopPublicUrl(saved.slug);
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      setForm(empty);
      setEditingId(null);
      setSlugLocked(false);
      if (!wasEdit) {
        setLastCreatedUrl(url);
        const copied = await copyText(url);
        notify.success(
          copied
            ? isAr
              ? `تم إنشاء الورشة ونسخ الرابط: ${url}`
              : `Workshop created — URL copied: ${url}`
            : isAr
              ? `تم إنشاء الورشة. الرابط: ${url}`
              : `Workshop created. URL: ${url}`,
        );
      } else {
        setLastCreatedUrl(url);
        notify.success(isAr ? 'تم حفظ الورشة' : 'Workshop saved');
      }
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed')),
  });

  const patch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workshop> }) =>
      api(`/calendar/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      notify.success(isAr ? 'تم التحديث' : 'Updated');
    },
    onError: () => notify.error(isAr ? 'فشل التحديث' : 'Update failed'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/calendar/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-calendar'] });
      notify.success(isAr ? 'تم الحذف' : 'Deleted');
    },
    onError: () => notify.error(isAr ? 'فشل الحذف' : 'Delete failed'),
  });

  function edit(row: Workshop) {
    setEditingId(row.id);
    setSlugLocked(true);
    setLastCreatedUrl(workshopPublicUrl(row.slug));
    setForm({
      title: row.title,
      titleEn: row.titleEn || '',
      slug: row.slug,
      description: row.description || '',
      descriptionEn: row.descriptionEn || '',
      coverUrl: row.coverUrl || '',
      presenterAr: row.presenterAr || '',
      presenterEn: row.presenterEn || '',
      startsAt: toLocalInput(row.startsAt),
      endsAt: toLocalInput(row.endsAt),
      isPublished: row.isPublished,
      isFeatured: row.isFeatured,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function statusOf(row: Workshop) {
    if (new Date(row.endsAt).getTime() < now) return isAr ? 'منتهية' : 'Ended';
    if (!row.isPublished) return isAr ? 'متوقفة' : 'Off';
    if (row.isFeatured) return isAr ? 'إعلان' : 'Featured';
    return isAr ? 'منشورة' : 'Live';
  }

  function setAr(field: 'title' | 'description' | 'presenterAr', raw: string) {
    const next = filterArabicOnly(raw);
    setForm((prev) => ({ ...prev, [field]: next }));
  }

  function setEn(field: 'titleEn' | 'descriptionEn' | 'presenterEn', raw: string) {
    const next = filterEnglishOnly(raw);
    setForm((prev) => {
      if (field === 'titleEn' && !editingId && !slugLocked) {
        return { ...prev, titleEn: next, slug: slugify(next) };
      }
      return { ...prev, [field]: next };
    });
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'الفعاليات' : 'Events'}
        title={isAr ? 'الورش' : 'Workshops'}
        description={
          isAr
            ? 'يُنشأ رابط الورشة تلقائياً من الاسم الإنجليزي. انشر الورشة ليظهر رابطها في الموقع.'
            : 'Workshop URL is auto-generated from the English title. Publish to show it on the website.'
        }
      />

      {lastCreatedUrl ? (
        <section className="admin-panel flex flex-wrap items-center justify-between gap-3 border border-[#1fb6d1]/30 bg-[#e8f9fc]/50">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1789a2]">
              {isAr ? 'رابط الورشة للمشاركة' : 'Shareable workshop URL'}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-[var(--color-ink)]">{lastCreatedUrl}</p>
          </div>
          <Button
            type="button"
            variant="accent"
            onClick={async () => {
              const ok = await copyText(lastCreatedUrl);
              notify.success(ok ? (isAr ? 'تم نسخ الرابط' : 'URL copied') : lastCreatedUrl);
            }}
          >
            {isAr ? 'نسخ الرابط' : 'Copy URL'}
          </Button>
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">{isAr ? 'الورش الحالية' : 'Current workshops'}</h2>
          <span className="rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-muted)]">
            {rows.length}
          </span>
        </div>
        {isLoading ? <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}
        <div className="overflow-x-auto">
          <table className="dc-table">
            <thead>
              <tr>
                <th>{isAr ? 'الورشة' : 'Workshop'}</th>
                <th>{isAr ? 'الرابط' : 'URL'}</th>
                <th>{isAr ? 'المقدّم' : 'Presenter'}</th>
                <th>{isAr ? 'الموعد' : 'Date'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ended = new Date(row.endsAt).getTime() < now;
                const url = workshopPublicUrl(row.slug);
                return (
                  <tr key={row.id}>
                    <td>
                      <strong className="block text-sm">{row.title}</strong>
                    </td>
                    <td>
                      {row.isPublished ? (
                        <button
                          type="button"
                          className="max-w-[220px] truncate text-start text-xs font-semibold text-[#1789a2] hover:underline"
                          title={url}
                          onClick={async () => {
                            const ok = await copyText(url);
                            notify.success(ok ? (isAr ? 'تم نسخ الرابط' : 'URL copied') : url);
                          }}
                        >
                          /workshops/{row.slug}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--color-ink-muted)]">
                          {isAr ? 'غير منشور — لا يظهر بالموقع' : 'Unpublished — hidden on site'}
                        </span>
                      )}
                    </td>
                    <td className="text-sm">{row.presenterAr || '—'}</td>
                    <td className="text-xs">
                      {new Date(row.startsAt).toLocaleString(isAr ? 'ar-IQ' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span
                        className={`status-chip ${
                          ended || !row.isPublished
                            ? 'status-archived'
                            : row.isFeatured
                              ? 'status-draft'
                              : 'status-published'
                        }`}
                      >
                        {statusOf(row)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Button type="button" size="sm" variant="secondary" onClick={() => edit(row)}>
                          {isAr ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={row.isPublished ? 'outline' : 'accent'}
                          onClick={() => patch.mutate({ id: row.id, data: { isPublished: !row.isPublished } })}
                        >
                          {row.isPublished ? (isAr ? 'إيقاف' : 'Turn off') : isAr ? 'نشر' : 'Publish'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={row.isFeatured ? 'accent' : 'outline'}
                          onClick={() =>
                            patch.mutate({
                              id: row.id,
                              data: { isFeatured: !row.isFeatured, isPublished: true },
                            })
                          }
                        >
                          {row.isFeatured ? (isAr ? 'إلغاء الإعلان' : 'Unfeature') : isAr ? 'إعلان' : 'Announce'}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => remove.mutate(row.id)}>
                          {isAr ? 'حذف' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && !rows.length ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
            {isAr ? 'لا توجد ورش بعد.' : 'No workshops yet.'}
          </p>
        ) : null}
      </section>

      <form
        className="admin-panel"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">
              {editingId ? (isAr ? 'تعديل ورشة' : 'Edit workshop') : isAr ? 'ورشة جديدة' : 'New workshop'}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr
                ? 'اكتب العنوان الإنجليزي ليُنشأ الرابط تلقائياً. انشر الورشة ليظهر الرابط في الموقع.'
                : 'Enter the English title to auto-generate the URL. Publish so the link appears on the site.'}
            </p>
          </div>
          <div className="flex gap-2">
            <LocalePill locale="ar" complete={Boolean(form.title.trim() && form.presenterAr.trim())} />
            <LocalePill locale="en" complete={Boolean(form.titleEn.trim() && form.presenterEn.trim())} />
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1">
            <Input
              id="slug"
              label={isAr ? 'رابط الورشة (تلقائي)' : 'Workshop URL slug (auto)'}
              value={form.slug}
              onChange={(e) => {
                setSlugLocked(true);
                setForm({ ...form, slug: filterEnglishOnly(e.target.value.toLowerCase()).replace(/\s+/g, '-') });
              }}
              placeholder="guided-surgery-workshop"
            />
            {form.slug ? (
              <p className="truncate text-[11px] text-[var(--color-ink-muted)]">{workshopPublicUrl(form.slug)}</p>
            ) : null}
          </div>
          <Input
            id="startsAt"
            label={isAr ? 'البداية *' : 'Starts *'}
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
          <Input
            id="endsAt"
            label={isAr ? 'النهاية *' : 'Ends *'}
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
          <MediaImageField
            id="coverUrl"
            label={isAr ? 'صورة الغلاف' : 'Cover image'}
            value={form.coverUrl}
            onChange={(coverUrl) => setForm({ ...form, coverUrl })}
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            {isAr ? 'منشورة على الموقع (يظهر الرابط)' : 'Published on website (shows URL)'}
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked, isPublished: e.target.checked || form.isPublished })}
            />
            {isAr ? 'إعلان في الرئيسية' : 'Homepage announcement'}
          </label>
        </div>

        <div className="bilingual-grid">
          <section className="bilingual-column">
            <header>
              <strong>العربية *</strong>
              <span>عربي فقط</span>
            </header>
            <Input id="title" label="عنوان الورشة *" value={form.title} onChange={(e) => setAr('title', e.target.value)} />
            <Input
              id="presenterAr"
              label="مقدّم الورشة *"
              value={form.presenterAr}
              onChange={(e) => setAr('presenterAr', e.target.value)}
              placeholder="د. عمار العبيدي"
            />
            <Textarea
              id="description"
              label="تفاصيل الورشة"
              value={form.description}
              onChange={(e) => setAr('description', e.target.value)}
              rows={5}
            />
          </section>
          <section className="bilingual-column is-en">
            <header>
              <strong>English *</strong>
              <span>English only — drives the URL</span>
            </header>
            <Input id="titleEn" label="Workshop title *" value={form.titleEn} onChange={(e) => setEn('titleEn', e.target.value)} />
            <Input
              id="presenterEn"
              label="Presenter *"
              value={form.presenterEn}
              onChange={(e) => setEn('presenterEn', e.target.value)}
              placeholder="Dr. Ammar Al-Obaidi"
            />
            <Textarea
              id="descriptionEn"
              label="Workshop details"
              value={form.descriptionEn}
              onChange={(e) => setEn('descriptionEn', e.target.value)}
              rows={5}
            />
          </section>
        </div>

        <div className="admin-form-footer">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending
              ? isAr
                ? 'جاري الحفظ...'
                : 'Saving...'
              : editingId
                ? isAr
                  ? 'حفظ التعديل'
                  : 'Save changes'
                : isAr
                  ? 'إنشاء الورشة'
                  : 'Create workshop'}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setSlugLocked(false);
                setForm(empty);
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
