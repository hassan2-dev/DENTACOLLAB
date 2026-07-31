import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Input, Textarea } from '@dentacollab/ui';
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

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'التواصل' : 'Contact'}
        title={isAr ? 'رسائل التواصل' : 'Contact messages'}
        description={
          isAr
            ? 'طلبات فورم التواصل من الموقع — للاطلاع والمتابعة، بدون رد داخل المنصة.'
            : 'Contact form submissions from the website — review and follow up outside the platform.'
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
                    ? 'border-[#1fb6d1]/35 bg-[#f3fbfd]'
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
                  {isNew ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => mark.mutate({ id: m.id, status: 'READ' })}>
                      {isAr ? 'تعيين كمقروء' : 'Mark as read'}
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => mark.mutate({ id: m.id, status: 'UNREAD' })}>
                      {isAr ? 'تعيين كجديد' : 'Mark as new'}
                    </Button>
                  )}
                  {m.email ? (
                    <Button type="button" size="sm" variant="accent" asChild>
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>
                        {isAr ? 'فتح البريد' : 'Open email'}
                      </a>
                    </Button>
                  ) : null}
                  {m.phone ? (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <a href={`tel:${m.phone}`}>{isAr ? 'اتصال' : 'Call'}</a>
                    </Button>
                  ) : null}
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

export function SettingsAdminPage() {
  return <Navigate to="/" replace />;
}

export function KnowledgeAdminPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const entries = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => api<Array<{ id: string; question: string; answer: string }>>('/knowledge/entries'),
  });
  const docs = useQuery({
    queryKey: ['knowledge-docs'],
    queryFn: () => api<Array<{ id: string; title: string; sourceType: string }>>('/knowledge/documents'),
  });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [url, setUrl] = useState('');

  const addEntry = useMutation({
    mutationFn: () => api('/knowledge/entries', { method: 'POST', body: JSON.stringify({ question, answer }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge-entries'] });
      setQuestion('');
      setAnswer('');
      notify.success(isAr ? 'تمت إضافة السؤال' : 'Entry added');
    },
    onError: () => notify.error(isAr ? 'فشلت الإضافة' : 'Add failed'),
  });
  const addUrl = useMutation({
    mutationFn: () => api('/knowledge/documents/url', { method: 'POST', body: JSON.stringify({ title: urlTitle, url }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge-docs'] });
      setUrlTitle('');
      setUrl('');
      notify.success(isAr ? 'تمت إضافة الرابط' : 'URL added');
    },
    onError: () => notify.error(isAr ? 'فشلت الإضافة' : 'Add failed'),
  });
  const reindex = useMutation({
    mutationFn: () => api('/knowledge/reindex', { method: 'POST' }),
    onSuccess: () => notify.success(isAr ? 'بدأت إعادة الفهرسة' : 'Reindex started'),
    onError: () => notify.error(isAr ? 'فشلت إعادة الفهرسة' : 'Reindex failed'),
  });
  const removeEntry = useMutation({
    mutationFn: (id: string) => api(`/knowledge/entries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge-entries'] });
      notify.success(isAr ? 'تم الحذف' : 'Deleted');
    },
    onError: () => notify.error(isAr ? 'فشل الحذف' : 'Delete failed'),
  });

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'الذكاء الاصطناعي' : 'AI'}
        title={isAr ? 'قاعدة معرفة الذكاء الاصطناعي' : 'AI knowledge base'}
        description={
          isAr
            ? 'أسئلة وأجوبة ومستندات تغذي مساعد الدردشة.'
            : 'Q&A entries and documents that power the chat assistant.'
        }
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => reindex.mutate()}>
          {isAr ? 'إعادة الفهرسة' : 'Reindex'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="admin-panel"
          onSubmit={(e) => {
            e.preventDefault();
            addEntry.mutate();
          }}
        >
          <h2 className="mb-3 text-lg font-black">{isAr ? 'سؤال وجواب' : 'Q&A'}</h2>
          <Input id="q" label={isAr ? 'السؤال' : 'Question'} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <Textarea id="a" label={isAr ? 'الإجابة' : 'Answer'} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <Button type="submit">{isAr ? 'إضافة' : 'Add'}</Button>
        </form>
        <form
          className="admin-panel"
          onSubmit={(e) => {
            e.preventDefault();
            addUrl.mutate();
          }}
        >
          <h2 className="mb-3 text-lg font-black">{isAr ? 'رابط / رفع ملف' : 'URL / upload'}</h2>
          <Input
            id="urlTitle"
            label={isAr ? 'عنوان الرابط' : 'URL title'}
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
          />
          <Input id="url" label={isAr ? 'الرابط' : 'URL'} value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button type="submit" className="mb-4">
            {isAr ? 'إضافة رابط' : 'Add URL'}
          </Button>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.xls,.txt"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const fd = new FormData();
                fd.append('file', file);
                await api('/knowledge/documents/upload', { method: 'POST', body: fd });
                qc.invalidateQueries({ queryKey: ['knowledge-docs'] });
                notify.success(isAr ? 'تم رفع المستند' : 'Document uploaded');
              } catch {
                notify.error(isAr ? 'فشل رفع المستند' : 'Document upload failed');
              }
              e.target.value = '';
            }}
          />
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ul className="admin-panel space-y-2">
          {(entries.data || []).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 last:border-b-0"
            >
              <span className="min-w-0 flex-1 break-words text-sm">{e.question}</span>
              <Button type="button" size="sm" variant="destructive" onClick={() => removeEntry.mutate(e.id)}>
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </li>
          ))}
          {!entries.data?.length ? (
            <li className="py-6 text-center text-sm text-[var(--color-ink-muted)]">
              {isAr ? 'لا توجد أسئلة بعد.' : 'No entries yet.'}
            </li>
          ) : null}
        </ul>
        <ul className="admin-panel space-y-2">
          {(docs.data || []).map((d) => (
            <li key={d.id}>
              {d.title} <span className="text-xs text-[var(--color-ink-muted)]">({d.sourceType})</span>
            </li>
          ))}
          {!docs.data?.length ? (
            <li className="py-6 text-center text-sm text-[var(--color-ink-muted)]">
              {isAr ? 'لا توجد مستندات بعد.' : 'No documents yet.'}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

export { CalendarAdminPage } from './WorkshopsAdminPage';
