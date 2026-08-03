import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Input, Select, Textarea } from '@dentacollab/ui';
import { api } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { LocalePill, PageHeader } from '../components/AdminUi';
import { MediaImageField, MediaImagesField } from '../components/MediaImageField';
import { Button } from '../components/ui/button';
import { bilingualErrorMessage, filterArabicOnly, filterEnglishOnly, hasCompleteTranslation, missingBilingualFields } from '../lib/bilingual';
import { notify } from '../lib/toast';

export function GalleryAdminPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const albums = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: () =>
      api<
        Array<{
          id: string;
          title: string;
          description?: string;
          coverUrl?: string;
          media?: Array<{ id: string; url: string }>;
          translations?: Array<{ locale: string; title: string; description?: string }>;
        }>
      >('/gallery/admin/all'),
  });

  const media = useQuery({
    queryKey: ['media'],
    queryFn: () => api<Array<{ id: string; name: string; url: string; type: string; size: number }>>('/media'),
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    coverUrl: '',
    mediaUrls: [] as string[],
    en_title: '',
    en_description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api<{ url: string }>('/media/upload', { method: 'POST', body: fd });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      notify.success(isAr ? 'تم رفع الملف' : 'File uploaded');
    },
    onError: () => notify.error(isAr ? 'فشل الرفع' : 'Upload failed'),
  });

  const removeMedia = useMutation({
    mutationFn: (id: string) => api(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      notify.success(isAr ? 'تم حذف الملف' : 'File deleted');
    },
    onError: (err: Error) =>
      notify.error(err.message || (isAr ? 'فشل الحذف' : 'Delete failed')),
  });

  const saveAlbum = useMutation({
    mutationFn: async () => {
      const missing = missingBilingualFields(
        [
          { key: 'title', ar: form.title, en: form.en_title, labelAr: 'عنوان الألبوم', labelEn: 'Album title' },
          { key: 'description', ar: form.description, en: form.en_description, labelAr: 'الوصف', labelEn: 'Description' },
        ],
        language,
      );
      if (missing.length) {
        const message = bilingualErrorMessage(missing, language) || '';
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);
      if (!form.coverUrl) {
        const message = isAr ? 'صورة الغلاف مطلوبة' : 'Cover image is required';
        setFormError(message);
        throw new Error(message);
      }
      if (!form.mediaUrls.length) {
        const message = isAr ? 'أضف صورة واحدة على الأقل داخل الألبوم' : 'Add at least one interior image';
        setFormError(message);
        throw new Error(message);
      }
      return api('/gallery', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          coverUrl: form.coverUrl,
          media: form.mediaUrls.map((url) => ({ url, type: 'IMAGE' })),
          translations: [{ locale: 'en', title: form.en_title.trim(), description: form.en_description.trim() }],
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] });
      setForm({ title: '', description: '', coverUrl: '', mediaUrls: [], en_title: '', en_description: '' });
      notify.success(isAr ? 'تم إنشاء الألبوم' : 'Album created');
    },
    onError: (err: Error) => {
      notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    },
  });

  const removeAlbum = useMutation({
    mutationFn: (id: string) => api(`/gallery/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] });
      notify.success(isAr ? 'تم حذف الألبوم' : 'Album deleted');
    },
    onError: () => notify.error(isAr ? 'فشل الحذف' : 'Delete failed'),
  });

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'المحتوى' : 'Content'}
        title={isAr ? 'المعرض والوسائط' : 'Gallery & media'}
        description={
          isAr
            ? 'ارفع الصور هنا واستخدمها في ألبومات المعرض وفي باقي الموقع.'
            : 'Upload images here and use them in gallery albums and across the site.'
        }
      />

      <section className="admin-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{isAr ? 'مكتبة الملفات' : 'Media library'}</h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr
                ? 'ارفع صوراً ثم اخترها بالضغط. الحذف ممنوع إذا الملف مستخدم بدورة أو ألبوم أو ورشة أو غيرها.'
                : 'Upload images, then select by clicking. Delete is blocked while a file is used by a course, album, workshop, or other content.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-muted)]">
              {media.data?.length || 0}
            </span>
            <Button type="button" size="sm" variant="secondary" disabled={upload.isPending} onClick={() => uploadInputRef.current?.click()}>
              {upload.isPending ? (isAr ? 'جاري الرفع...' : 'Uploading...') : isAr ? 'رفع ملف' : 'Upload file'}
            </Button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,video/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {media.isLoading ? <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(media.data || []).map((m) => (
            <div key={m.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              {m.type === 'IMAGE' ? (
                <img src={m.url} alt={m.name} className="mb-2 h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="mb-2 grid h-28 place-items-center rounded-lg bg-[var(--color-bg)] text-xs font-bold text-[var(--color-ink-muted)]">
                  {m.type}
                </div>
              )}
              <p className="truncate text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {m.type} · {(m.size / 1024).toFixed(1)} KB
              </p>
              <div className="admin-row-actions mt-3">
                <Button type="button" size="sm" variant="outline" asChild>
                  <a href={m.url} target="_blank" rel="noreferrer">
                    {isAr ? 'فتح' : 'Open'}
                  </a>
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => removeMedia.mutate(m.id)}>
                  {isAr ? 'حذف' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {!media.isLoading && !media.data?.length ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
            {isAr ? 'لا توجد ملفات بعد. ارفع أول صورة.' : 'No files yet. Upload your first image.'}
          </p>
        ) : null}
      </section>

      <form
        className="admin-panel max-w-4xl"
        onSubmit={(e) => {
          e.preventDefault();
          saveAlbum.mutate();
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{isAr ? 'ألبوم للمعرض العام' : 'Public gallery album'}</h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr ? 'يظهر في صفحة المعرض على الموقع.' : 'Appears on the public gallery page.'}
            </p>
          </div>
          <div className="flex gap-2">
            <LocalePill locale="ar" complete={Boolean(form.title.trim())} />
            <LocalePill locale="en" complete={Boolean(form.en_title.trim())} />
          </div>
        </div>

        <div className="bilingual-grid">
          <section className="bilingual-column">
            <header>
              <strong>العربية *</strong>
              <span>عربي فقط</span>
            </header>
            <Input id="title" label="عنوان الألبوم *" value={form.title} onChange={(e) => setForm({ ...form, title: filterArabicOnly(e.target.value) })} />
            <Textarea
              id="description"
              label="الوصف *"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: filterArabicOnly(e.target.value) })}
            />
          </section>
          <section className="bilingual-column is-en">
            <header>
              <strong>English *</strong>
              <span>English only</span>
            </header>
            <Input
              id="en_title"
              label="Album title *"
              value={form.en_title}
              onChange={(e) => setForm({ ...form, en_title: filterEnglishOnly(e.target.value) })}
            />
            <Textarea
              id="en_description"
              label="Description *"
              value={form.en_description}
              onChange={(e) => setForm({ ...form, en_description: filterEnglishOnly(e.target.value) })}
            />
          </section>
        </div>

        <div className="mt-5 space-y-5">
          <MediaImageField
            id="coverUrl"
            label={isAr ? 'غلاف الألبوم (صورة واحدة)' : 'Album cover (one image)'}
            value={form.coverUrl}
            onChange={(coverUrl) => setForm({ ...form, coverUrl })}
          />
          <MediaImagesField
            label={isAr ? 'صور داخل الألبوم (عدة صور)' : 'Album interior images (multiple)'}
            value={form.mediaUrls}
            onChange={(mediaUrls) => setForm({ ...form, mediaUrls })}
          />
        </div>
        {formError ? <p className="form-error mt-4">{formError}</p> : null}
        <div className="admin-form-footer">
          <Button type="submit" disabled={saveAlbum.isPending}>
            {saveAlbum.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'إنشاء ألبوم' : 'Create album'}
          </Button>
        </div>
      </form>

      <section className="admin-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">{isAr ? 'ألبومات المعرض' : 'Gallery albums'}</h2>
          <span className="rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-muted)]">
            {albums.data?.length || 0}
          </span>
        </div>
        <ul className="space-y-2">
          {(albums.data || []).map((a) => {
            const complete = hasCompleteTranslation(a);
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {a.coverUrl ? (
                    <img src={a.coverUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : null}
                  <div className="min-w-0">
                    <strong className="block truncate text-sm">{a.title}</strong>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                      {isAr ? `${a.media?.length || 0} صورة داخلية` : `${a.media?.length || 0} interior images`}
                    </p>
                    <div className="mt-1 flex gap-1.5">
                      <LocalePill locale="ar" complete />
                      <LocalePill locale="en" complete={complete} />
                    </div>
                  </div>
                </div>
                <Button type="button" size="sm" variant="destructive" onClick={() => removeAlbum.mutate(a.id)}>
                  {isAr ? 'حذف' : 'Delete'}
                </Button>
              </li>
            );
          })}
        </ul>
        {!albums.data?.length ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
            {isAr ? 'لا توجد ألبومات بعد.' : 'No albums yet.'}
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function MediaAdminPage() {
  return <Navigate to="/gallery" replace />;
}

export function MessagesPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () =>
      api<
        Array<{
          id: string;
          fullName: string;
          email: string;
          phone?: string;
          subject: string;
          message: string;
          status: string;
          createdAt: string;
        }>
      >('/contact/messages'),
  });

  const mark = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/contact/messages/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      notify.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
    },
    onError: () => notify.error(isAr ? 'فشل التحديث' : 'Update failed'),
  });

  const statusLabel = (status: string) => {
    if (status === 'UNREAD') return isAr ? 'جديد' : 'New';
    if (status === 'READ') return isAr ? 'مقروء' : 'Read';
    if (status === 'REPLIED') return isAr ? 'تم الرد خارجياً' : 'Handled';
    return status;
  };

  function whatsappHref(phone: string, name: string, subject: string) {
    let digits = phone.replace(/[^\d]/g, '');
    if (digits.startsWith('0')) digits = `964${digits.slice(1)}`;
    const text = isAr
      ? `مرحباً ${name}، بخصوص رسالتك: ${subject}`
      : `Hi ${name}, regarding your message: ${subject}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'التواصل' : 'Contact'}
        title={isAr ? 'رسائل التواصل' : 'Contact messages'}
        description={
          isAr
            ? 'طلبات فورم التواصل من الموقع — رد عبر واتساب أو البريد.'
            : 'Contact form submissions — reply via WhatsApp or email.'
        }
      />

      <section className="admin-panel">
        {isLoading ? (
          <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : null}

        <div className="space-y-3">
          {(data || []).map((m) => {
            const isNew = m.status === 'UNREAD';
            return (
              <article
                key={m.id}
                className={`rounded-xl border p-4 ${
                  isNew
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-[var(--color-ink)]">{m.subject}</h2>
                      <span className={`status-chip ${isNew ? 'status-draft' : 'status-published'}`}>
                        {statusLabel(m.status)}
                      </span>
                    </div>
                    <p className="break-words text-sm text-[var(--color-ink-muted)]">
                      {m.fullName}
                      {m.email ? ` · ${m.email}` : ''}
                      {m.phone ? ` · ${m.phone}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {new Date(m.createdAt).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                    </p>
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--color-ink)]">{m.message}</p>

                <div className="admin-row-actions mt-4">
                  {m.phone ? (
                    <Button type="button" size="sm" asChild>
                      <a
                        href={whatsappHref(m.phone, m.fullName, m.subject)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (isNew) mark.mutate({ id: m.id, status: 'READ' });
                        }}
                      >
                        {isAr ? 'رد واتساب' : 'Reply WhatsApp'}
                      </a>
                    </Button>
                  ) : null}
                  {m.email ? (
                    <Button type="button" size="sm" variant="secondary" asChild>
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>
                        {isAr ? 'رد بالإيميل' : 'Reply email'}
                      </a>
                    </Button>
                  ) : null}
                  {isNew ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => mark.mutate({ id: m.id, status: 'READ' })}>
                      {isAr ? 'تعيين كمقروء' : 'Mark as read'}
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => mark.mutate({ id: m.id, status: 'UNREAD' })}>
                      {isAr ? 'تعيين كجديد' : 'Mark as new'}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}

          {!isLoading && !data?.length ? (
            <p className="py-10 text-center text-sm text-[var(--color-ink-muted)]">
              {isAr ? 'لا توجد رسائل من فورم التواصل بعد.' : 'No contact form messages yet.'}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function ContentAdminPage() {
  return <Navigate to="/" replace />;
}

type SettingsMap = Record<string, Record<string, unknown>>;

type SettingsTab =
  | 'general'
  | 'invoice'
  | 'stripe'
  | 'resend'
  | 'r2'
  | 'openai'
  | 'currency';

const MASK = '********';
const SECRET_FIELDS: Record<string, Set<string>> = {
  stripe: new Set(['secretKey', 'webhookSecret', 'publishableKey']),
  resend: new Set(['apiKey']),
  r2: new Set(['accessKeyId', 'secretAccessKey']),
  openai: new Set(['apiKey']),
};

function asString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function maskIfSecret(value: string, sensitive: boolean) {
  if (!sensitive) return value;
  if (!value || value.includes('****')) return value || '';
  return MASK;
}

function prepareSettingsPayload(form: SettingsMap): SettingsMap {
  const payload: SettingsMap = {};
  for (const [group, values] of Object.entries(form)) {
    const next: Record<string, unknown> = {};
    const secrets = SECRET_FIELDS[group];
    for (const [key, raw] of Object.entries(values)) {
      if (key.endsWith('Configured')) continue;
      const value = asString(raw);
      if (secrets?.has(key)) {
        if (!value.trim() || value.includes('****')) {
          next[key] = MASK;
        } else {
          next[key] = value.trim();
        }
      } else if (group === 'currency' && key === 'taxPercent') {
        next[key] = value.trim() === '' ? 0 : Number(value);
      } else if (group === 'general') {
        next[key] = value;
        if (key === 'name') next.siteName = value;
        if (key === 'address') next.location = value;
      } else {
        next[key] = value;
      }
    }
    payload[group] = next;
  }
  return payload;
}

export function SettingsAdminPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [form, setForm] = useState<SettingsMap>({
    general: { name: '', email: '', phone: '', address: '', logoUrl: '' },
    invoice: {
      companyName: '',
      tagline: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      prefix: 'INV',
      logoUrl: '',
    },
    stripe: { secretKey: '', webhookSecret: '', publishableKey: '' },
    resend: { apiKey: '', fromEmail: '' },
    r2: { endpoint: '', accessKeyId: '', secretAccessKey: '', bucket: '', publicUrl: '' },
    openai: { apiKey: '' },
    currency: { defaultCurrency: 'IQD', taxPercent: '0' },
  });

  const query = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api<SettingsMap>('/settings/admin'),
  });

  useEffect(() => {
    if (!query.data) return;
    const d = query.data;
    const general = d.general || {};
    const invoice = d.invoice || {};
    const stripe = d.stripe || {};
    const resend = d.resend || {};
    const r2 = d.r2 || {};
    const openai = d.openai || {};
    const currency = d.currency || {};

    setForm({
      general: {
        name: asString(general.name || general.siteName),
        email: asString(general.email),
        phone: asString(general.phone),
        address: asString(general.address || general.location),
        logoUrl: asString(general.logoUrl),
      },
      invoice: {
        companyName: asString(invoice.companyName),
        tagline: asString(invoice.tagline),
        email: asString(invoice.email),
        phone: asString(invoice.phone),
        address: asString(invoice.address),
        taxId: asString(invoice.taxId),
        prefix: asString(invoice.prefix) || 'INV',
        logoUrl: asString(invoice.logoUrl),
      },
      stripe: {
        secretKey: maskIfSecret(asString(stripe.secretKey), true),
        webhookSecret: maskIfSecret(asString(stripe.webhookSecret), true),
        publishableKey: maskIfSecret(asString(stripe.publishableKey), true),
      },
      resend: {
        apiKey: maskIfSecret(asString(resend.apiKey), true),
        fromEmail: asString(resend.fromEmail),
      },
      r2: {
        endpoint: asString(r2.endpoint),
        accessKeyId: maskIfSecret(asString(r2.accessKeyId), true),
        secretAccessKey: maskIfSecret(asString(r2.secretAccessKey), true),
        bucket: asString(r2.bucket),
        publicUrl: asString(r2.publicUrl),
      },
      openai: {
        apiKey: maskIfSecret(asString(openai.apiKey), true),
      },
      currency: {
        defaultCurrency: asString(currency.defaultCurrency) || 'IQD',
        taxPercent: asString(currency.taxPercent ?? '0'),
      },
    });
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      api('/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: prepareSettingsPayload(form) }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      notify.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved');
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed')),
  });

  function setField(group: SettingsTab, key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
  }

  const tabs: Array<{ id: SettingsTab; ar: string; en: string }> = [
    { id: 'general', ar: 'عام / الشركة', en: 'General / Company' },
    { id: 'invoice', ar: 'الفاتورة', en: 'Invoice' },
    { id: 'stripe', ar: 'Stripe', en: 'Stripe' },
    { id: 'resend', ar: 'Resend', en: 'Resend' },
    { id: 'r2', ar: 'R2', en: 'R2' },
    { id: 'openai', ar: 'OpenAI', en: 'OpenAI' },
    { id: 'currency', ar: 'العملة والضريبة', en: 'Currency / Tax' },
  ];

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'النظام' : 'System'}
        title={isAr ? 'الإعدادات' : 'Settings'}
        description={
          isAr
            ? 'إعدادات الشركة، الفواتير، والمدفوعات. اترك الحقول السرية فارغة أو ******** لعدم استبدالها.'
            : 'Company, invoice, and payment settings. Leave secrets blank or ******** to keep current values.'
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={tab === item.id ? 'default' : 'outline'}
            onClick={() => setTab(item.id)}
          >
            {isAr ? item.ar : item.en}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : (
        <form
          className="admin-panel admin-form-card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {tab === 'general' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Input id="general-name" label={isAr ? 'الاسم' : 'Name'} value={asString(form.general.name)} onChange={(e) => setField('general', 'name', e.target.value)} />
              <Input id="general-email" label={isAr ? 'البريد' : 'Email'} value={asString(form.general.email)} onChange={(e) => setField('general', 'email', e.target.value)} />
              <Input id="general-phone" label={isAr ? 'الهاتف' : 'Phone'} value={asString(form.general.phone)} onChange={(e) => setField('general', 'phone', e.target.value)} />
              <Input id="general-address" label={isAr ? 'العنوان' : 'Address'} value={asString(form.general.address)} onChange={(e) => setField('general', 'address', e.target.value)} />
              <div className="md:col-span-2">
                <MediaImageField
                  id="general-logo"
                  label={isAr ? 'الشعار' : 'Logo URL'}
                  value={asString(form.general.logoUrl)}
                  onChange={(logoUrl) => setField('general', 'logoUrl', logoUrl)}
                />
              </div>
            </div>
          ) : null}

          {tab === 'invoice' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Input id="invoice-company" label={isAr ? 'اسم الشركة' : 'Company name'} value={asString(form.invoice.companyName)} onChange={(e) => setField('invoice', 'companyName', e.target.value)} />
              <Input id="invoice-tagline" label={isAr ? 'الشعار النصي' : 'Tagline'} value={asString(form.invoice.tagline)} onChange={(e) => setField('invoice', 'tagline', e.target.value)} />
              <Input id="invoice-email" label={isAr ? 'البريد' : 'Email'} value={asString(form.invoice.email)} onChange={(e) => setField('invoice', 'email', e.target.value)} />
              <Input id="invoice-phone" label={isAr ? 'الهاتف' : 'Phone'} value={asString(form.invoice.phone)} onChange={(e) => setField('invoice', 'phone', e.target.value)} />
              <Input id="invoice-address" label={isAr ? 'العنوان' : 'Address'} value={asString(form.invoice.address)} onChange={(e) => setField('invoice', 'address', e.target.value)} />
              <Input id="invoice-tax" label={isAr ? 'الرقم الضريبي' : 'Tax ID'} value={asString(form.invoice.taxId)} onChange={(e) => setField('invoice', 'taxId', e.target.value)} />
              <Input id="invoice-prefix" label={isAr ? 'بادئة الفاتورة' : 'Invoice prefix'} value={asString(form.invoice.prefix)} onChange={(e) => setField('invoice', 'prefix', e.target.value)} />
              <div className="md:col-span-2">
                <MediaImageField
                  id="invoice-logo"
                  label={isAr ? 'شعار الفاتورة' : 'Invoice logo'}
                  value={asString(form.invoice.logoUrl)}
                  onChange={(logoUrl) => setField('invoice', 'logoUrl', logoUrl)}
                />
              </div>
            </div>
          ) : null}

          {tab === 'stripe' ? (
            <div className="grid gap-3 md:grid-cols-1">
              <Input id="stripe-secret" label="Secret key" value={asString(form.stripe.secretKey)} onChange={(e) => setField('stripe', 'secretKey', e.target.value)} placeholder={MASK} />
              <Input id="stripe-webhook" label="Webhook secret" value={asString(form.stripe.webhookSecret)} onChange={(e) => setField('stripe', 'webhookSecret', e.target.value)} placeholder={MASK} />
              <Input id="stripe-publishable" label="Publishable key" value={asString(form.stripe.publishableKey)} onChange={(e) => setField('stripe', 'publishableKey', e.target.value)} placeholder={MASK} />
              <p className="text-xs text-[var(--color-ink-muted)]">
                {isAr
                  ? 'اترك الحقل فارغاً أو ******** للإبقاء على القيمة الحالية.'
                  : 'Leave blank or ******** to keep the current value.'}
              </p>
            </div>
          ) : null}

          {tab === 'resend' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Input id="resend-key" label="API key" value={asString(form.resend.apiKey)} onChange={(e) => setField('resend', 'apiKey', e.target.value)} placeholder={MASK} />
              <Input id="resend-from" label="From email" value={asString(form.resend.fromEmail)} onChange={(e) => setField('resend', 'fromEmail', e.target.value)} />
            </div>
          ) : null}

          {tab === 'r2' ? (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-ink-muted)]">
                {isAr
                  ? 'معلومات التخزين (اختيارية للحفظ من هنا).'
                  : 'Storage info (saving from here is optional).'}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input id="r2-endpoint" label="Endpoint" value={asString(form.r2.endpoint)} onChange={(e) => setField('r2', 'endpoint', e.target.value)} />
                <Input id="r2-bucket" label="Bucket" value={asString(form.r2.bucket)} onChange={(e) => setField('r2', 'bucket', e.target.value)} />
                <Input id="r2-access" label="Access key ID" value={asString(form.r2.accessKeyId)} onChange={(e) => setField('r2', 'accessKeyId', e.target.value)} placeholder={MASK} />
                <Input id="r2-secret" label="Secret access key" value={asString(form.r2.secretAccessKey)} onChange={(e) => setField('r2', 'secretAccessKey', e.target.value)} placeholder={MASK} />
                <div className="md:col-span-2">
                  <Input id="r2-public" label="Public URL" value={asString(form.r2.publicUrl)} onChange={(e) => setField('r2', 'publicUrl', e.target.value)} />
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'openai' ? (
            <Input id="openai-key" label="API key" value={asString(form.openai.apiKey)} onChange={(e) => setField('openai', 'apiKey', e.target.value)} placeholder={MASK} />
          ) : null}

          {tab === 'currency' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                id="default-currency"
                label={isAr ? 'العملة الافتراضية' : 'Default currency'}
                value={asString(form.currency.defaultCurrency)}
                onChange={(e) => setField('currency', 'defaultCurrency', e.target.value)}
              >
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </Select>
              <Input
                id="tax-percent"
                label={isAr ? 'نسبة الضريبة %' : 'Tax percent %'}
                type="number"
                min={0}
                value={asString(form.currency.taxPercent)}
                onChange={(e) => setField('currency', 'taxPercent', e.target.value)}
              />
            </div>
          ) : null}

          <div className="admin-form-footer">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ الإعدادات' : 'Save settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

type AuditLog = {
  id: string;
  userName: string;
  action: string;
  entity: string;
  details?: string | null;
  createdAt: string;
};

export function AuditLogsPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const [q, setQ] = useState('');

  const query = useQuery({
    queryKey: ['admin-audit-logs', q],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      const qs = params.toString();
      return api<AuditLog[]>(`/audit-logs${qs ? `?${qs}` : ''}`);
    },
  });

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'النظام' : 'System'}
        title={isAr ? 'سجل التدقيق' : 'Audit logs'}
        description={
          isAr
            ? 'تتبع إجراءات المشرفين على المدفوعات والإعدادات وغيرها.'
            : 'Track admin actions on payments, settings, and more.'
        }
      />

      <Input
        id="audit-search"
        label={isAr ? 'بحث' : 'Search'}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={isAr ? 'مستخدم / إجراء / كيان' : 'User / action / entity'}
      />

      <section className="admin-panel">
        <div className="overflow-x-auto">
          <table className="dc-table">
            <thead>
              <tr>
                <th>{isAr ? 'المستخدم' : 'User'}</th>
                <th>{isAr ? 'الإجراء' : 'Action'}</th>
                <th>{isAr ? 'الكيان' : 'Entity'}</th>
                <th>{isAr ? 'التفاصيل' : 'Details'}</th>
                <th>{isAr ? 'التاريخ' : 'Created at'}</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <tr>
                  <td colSpan={5} className="text-sm text-[var(--color-ink-muted)]">
                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                  </td>
                </tr>
              ) : (query.data || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm text-[var(--color-ink-muted)]">
                    {isAr ? 'لا توجد سجلات' : 'No audit logs'}
                  </td>
                </tr>
              ) : (
                (query.data || []).map((row) => (
                  <tr key={row.id}>
                    <td className="font-semibold">{row.userName}</td>
                    <td>{row.action}</td>
                    <td>{row.entity}</td>
                    <td className="max-w-xs truncate text-xs text-[var(--color-ink-muted)]">
                      {row.details || '—'}
                    </td>
                    <td className="text-xs text-[var(--color-ink-muted)]">
                      {new Date(row.createdAt).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function KnowledgeAdminPage() {
  return <Navigate to="/chatbot" replace />;
}

type ChatBotSettings = {
  welcomeAr: string;
  welcomeEn: string;
  goodbyeAr: string;
  goodbyeEn: string;
  outOfScopeAr: string;
  outOfScopeEn: string;
};

type ChatBotQa = {
  id: string;
  questionAr: string;
  answerAr: string;
  questionEn: string;
  answerEn: string;
  isActive: boolean;
  sortOrder: number;
};

export function ChatbotAdminPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const excelRef = useRef<HTMLInputElement>(null);

  const settingsQuery = useQuery({
    queryKey: ['chatbot-settings'],
    queryFn: () => api<ChatBotSettings>('/chatbot/settings'),
  });
  const qaQuery = useQuery({
    queryKey: ['chatbot-qa'],
    queryFn: () => api<ChatBotQa[]>('/chatbot/qa'),
  });

  const [settings, setSettings] = useState<ChatBotSettings>({
    welcomeAr: '',
    welcomeEn: '',
    goodbyeAr: '',
    goodbyeEn: '',
    outOfScopeAr: '',
    outOfScopeEn: '',
  });
  const [form, setForm] = useState({
    questionAr: '',
    answerAr: '',
    questionEn: '',
    answerEn: '',
  });

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveSettings = useMutation({
    mutationFn: () =>
      api('/chatbot/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatbot-settings'] });
      notify.success(isAr ? 'تم حفظ الإعدادات' : 'Settings saved');
    },
    onError: () => notify.error(isAr ? 'فشل الحفظ' : 'Save failed'),
  });

  const addQa = useMutation({
    mutationFn: () => api('/chatbot/qa', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatbot-qa'] });
      setForm({ questionAr: '', answerAr: '', questionEn: '', answerEn: '' });
      notify.success(isAr ? 'تمت إضافة السؤال' : 'Question added');
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشلت الإضافة' : 'Add failed')),
  });

  const removeQa = useMutation({
    mutationFn: (id: string) => api(`/chatbot/qa/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatbot-qa'] });
      notify.success(isAr ? 'تم الحذف' : 'Deleted');
    },
    onError: () => notify.error(isAr ? 'فشل الحذف' : 'Delete failed'),
  });

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'الدعم' : 'Support'}
        title={isAr ? 'الشات بوت' : 'Chatbot'}
        description={
          isAr
            ? 'أسئلة وأجوبة بدون ذكاء اصطناعي، مع ترحيب وتوديع وتحويل واتساب.'
            : 'FAQ chatbot without AI — welcome, goodbye, and WhatsApp handoff.'
        }
      />

      <form
        className="admin-panel space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings.mutate();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">{isAr ? 'الترحيب والتوديع' : 'Welcome & goodbye'}</h2>
          <div className="flex gap-2">
            <LocalePill locale="ar" complete />
            <LocalePill locale="en" complete />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea
            id="welcomeAr"
            label={isAr ? 'ترحيب (عربي)' : 'Welcome (AR)'}
            value={settings.welcomeAr}
            onChange={(e) => setSettings((s) => ({ ...s, welcomeAr: e.target.value }))}
          />
          <Textarea
            id="welcomeEn"
            label={isAr ? 'ترحيب (إنجليزي)' : 'Welcome (EN)'}
            value={settings.welcomeEn}
            onChange={(e) => setSettings((s) => ({ ...s, welcomeEn: e.target.value }))}
          />
          <Textarea
            id="goodbyeAr"
            label={isAr ? 'توديع (عربي)' : 'Goodbye (AR)'}
            value={settings.goodbyeAr}
            onChange={(e) => setSettings((s) => ({ ...s, goodbyeAr: e.target.value }))}
          />
          <Textarea
            id="goodbyeEn"
            label={isAr ? 'توديع (إنجليزي)' : 'Goodbye (EN)'}
            value={settings.goodbyeEn}
            onChange={(e) => setSettings((s) => ({ ...s, goodbyeEn: e.target.value }))}
          />
          <Textarea
            id="outOfScopeAr"
            label={isAr ? 'خارج النطاق (عربي)' : 'Out of scope (AR)'}
            value={settings.outOfScopeAr}
            onChange={(e) => setSettings((s) => ({ ...s, outOfScopeAr: e.target.value }))}
          />
          <Textarea
            id="outOfScopeEn"
            label={isAr ? 'خارج النطاق (إنجليزي)' : 'Out of scope (EN)'}
            value={settings.outOfScopeEn}
            onChange={(e) => setSettings((s) => ({ ...s, outOfScopeEn: e.target.value }))}
          />
        </div>
        <Button type="submit" disabled={saveSettings.isPending}>
          {isAr ? 'حفظ الإعدادات' : 'Save settings'}
        </Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="admin-panel space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addQa.mutate();
          }}
        >
          <h2 className="text-lg font-black">{isAr ? 'إضافة سؤال' : 'Add question'}</h2>
          <Input
            id="qAr"
            label={isAr ? 'السؤال (عربي)' : 'Question (AR)'}
            value={form.questionAr}
            onChange={(e) => setForm((f) => ({ ...f, questionAr: e.target.value }))}
          />
          <Textarea
            id="aAr"
            label={isAr ? 'الإجابة (عربي)' : 'Answer (AR)'}
            value={form.answerAr}
            onChange={(e) => setForm((f) => ({ ...f, answerAr: e.target.value }))}
          />
          <Input
            id="qEn"
            label={isAr ? 'السؤال (إنجليزي)' : 'Question (EN)'}
            value={form.questionEn}
            onChange={(e) => setForm((f) => ({ ...f, questionEn: e.target.value }))}
          />
          <Textarea
            id="aEn"
            label={isAr ? 'الإجابة (إنجليزي)' : 'Answer (EN)'}
            value={form.answerEn}
            onChange={(e) => setForm((f) => ({ ...f, answerEn: e.target.value }))}
          />
          <Button type="submit" disabled={addQa.isPending}>
            {isAr ? 'إضافة' : 'Add'}
          </Button>
        </form>

        <div className="admin-panel space-y-4">
          <h2 className="text-lg font-black">{isAr ? 'استيراد Excel' : 'Excel import'}</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {isAr
              ? 'الأعمدة المطلوبة: question_ar, answer_ar, question_en, answer_en'
              : 'Required columns: question_ar, answer_ar, question_en, answer_en'}
          </p>
          <input
            ref={excelRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const fd = new FormData();
                fd.append('file', file);
                const result = await api<{ imported: number; skipped: number }>('/chatbot/qa/import', {
                  method: 'POST',
                  body: fd,
                });
                qc.invalidateQueries({ queryKey: ['chatbot-qa'] });
                notify.success(
                  isAr
                    ? `تم استيراد ${result.imported} سؤال (تخطي ${result.skipped})`
                    : `Imported ${result.imported} (skipped ${result.skipped})`,
                );
              } catch (err) {
                notify.error(err instanceof Error ? err.message : isAr ? 'فشل الاستيراد' : 'Import failed');
              }
              e.target.value = '';
            }}
          />
          <Button type="button" variant="secondary" onClick={() => excelRef.current?.click()}>
            {isAr ? 'رفع ملف Excel' : 'Upload Excel file'}
          </Button>
        </div>
      </div>

      <ul className="admin-panel space-y-3">
        <h2 className="text-lg font-black">{isAr ? 'الأسئلة الحالية' : 'Current questions'}</h2>
        {(qaQuery.data || []).map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] py-3 last:border-b-0"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold">{isAr ? item.questionAr : item.questionEn}</p>
              <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">
                {isAr ? item.answerAr : item.answerEn}
              </p>
              <p className="text-[11px] text-[var(--color-ink-muted)]">
                {isAr ? item.questionEn : item.questionAr}
              </p>
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => removeQa.mutate(item.id)}>
              {isAr ? 'حذف' : 'Delete'}
            </Button>
          </li>
        ))}
        {!qaQuery.data?.length ? (
          <li className="py-6 text-center text-sm text-[var(--color-ink-muted)]">
            {isAr ? 'لا توجد أسئلة بعد.' : 'No questions yet.'}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export { CalendarAdminPage } from './WorkshopsAdminPage';
