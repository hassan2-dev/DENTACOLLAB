import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Input, Textarea, Select } from '@dentacollab/ui';
import { api } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { LocalePill, PageHeader } from '../components/AdminUi';
import { CourseFormBuilderModal } from '../components/CourseFormBuilderModal';
import { MediaImageField } from '../components/MediaImageField';
import { Button } from '../components/ui/button';
import { bilingualErrorMessage, filterArabicOnly, filterEnglishOnly, hasCompleteTranslation, missingBilingualFields } from '../lib/bilingual';
import { notify } from '../lib/toast';

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  overview: string;
  objectives: string[];
  requirements: string[];
  duration: string;
  level: string;
  status: string;
  price?: number | null;
  currency?: string | null;
  certificate?: string;
  coverUrl?: string;
  registrationStartsAt?: string | null;
  registrationEndsAt?: string | null;
  registrationClosedManually?: boolean;
  registrationState?: string;
  translations?: Array<{
    locale: string;
    title: string;
    description: string;
    overview: string;
    objectives: string[];
    requirements: string[];
    duration: string;
    certificate?: string;
  }>;
};

const empty = {
  title: '',
  slug: '',
  description: '',
  overview: '',
  objectives: '',
  requirements: '',
  duration: '',
  level: 'BASIC',
  price: '',
  currency: 'IQD',
  certificate: '',
  coverUrl: '',
  registrationStartsAt: '',
  registrationEndsAt: '',
  en_title: '',
  en_description: '',
  en_overview: '',
  en_objectives: '',
  en_requirements: '',
  en_duration: '',
  en_certificate: '',
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

export function CoursesAdminPage() {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isNew = location.pathname.endsWith('/new');
  const isEdit = Boolean(id);
  const isForm = isNew || isEdit;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api<Course[]>('/courses/admin/all'),
  });
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState<string | null>(null);
  const [formCourse, setFormCourse] = useState<Course | null>(null);
  const [formReady, setFormReady] = useState(!isEdit);

  const bilingualReady = useMemo(() => {
    const missing = missingBilingualFields(
      [
        { key: 'title', ar: form.title, en: form.en_title, labelAr: 'العنوان', labelEn: 'Title' },
        { key: 'description', ar: form.description, en: form.en_description, labelAr: 'الوصف', labelEn: 'Description' },
        { key: 'overview', ar: form.overview, en: form.en_overview, labelAr: 'النظرة العامة', labelEn: 'Overview' },
        { key: 'objectives', ar: form.objectives, en: form.en_objectives, labelAr: 'الأهداف', labelEn: 'Objectives' },
        { key: 'requirements', ar: form.requirements, en: form.en_requirements, labelAr: 'المتطلبات', labelEn: 'Requirements' },
        { key: 'duration', ar: form.duration, en: form.en_duration, labelAr: 'المدة', labelEn: 'Duration' },
      ],
      language,
    );
    return missing;
  }, [form, language]);

  const save = useMutation({
    mutationFn: async () => {
      const missing = bilingualReady;
      if (missing.length || !form.slug.trim()) {
        const message =
          bilingualErrorMessage(missing, language) ||
          (isAr ? 'Slug مطلوب' : 'Slug is required');
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);

      const priceValue = form.price.trim() === '' ? null : Number(form.price);
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        overview: form.overview.trim(),
        objectives: form.objectives.split('\n').map((item) => item.trim()).filter(Boolean),
        requirements: form.requirements.split('\n').map((item) => item.trim()).filter(Boolean),
        duration: form.duration.trim(),
        level: form.level,
        price: Number.isFinite(priceValue as number) ? priceValue : null,
        currency: form.currency.trim() || 'IQD',
        certificate: form.certificate.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
        registrationStartsAt: fromDatetimeLocal(form.registrationStartsAt),
        registrationEndsAt: fromDatetimeLocal(form.registrationEndsAt),
        translations: [
          {
            locale: 'en',
            title: form.en_title.trim(),
            description: form.en_description.trim(),
            overview: form.en_overview.trim(),
            objectives: form.en_objectives.split('\n').map((item) => item.trim()).filter(Boolean),
            requirements: form.en_requirements.split('\n').map((item) => item.trim()).filter(Boolean),
            duration: form.en_duration.trim(),
            certificate: form.en_certificate.trim() || undefined,
          },
        ],
      };

      if (isEdit && id) return api(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      return api('/courses', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      setForm(empty);
      setFormError(null);
      notify.success(isEdit ? (isAr ? 'تم حفظ الدورة' : 'Course saved') : isAr ? 'تم إنشاء الدورة' : 'Course created');
      navigate('/courses');
    },
    onError: (err: Error) => {
      notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    },
  });

  const publish = useMutation({
    mutationFn: (id: string) => api(`/courses/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      notify.success(isAr ? 'تم نشر الدورة' : 'Course published');
    },
    onError: () => notify.error(isAr ? 'فشل النشر' : 'Publish failed'),
  });
  const closeCourse = useMutation({
    mutationFn: (id: string) => api(`/courses/${id}/close`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      notify.success(isAr ? 'تم إغلاق الدورة' : 'Course closed');
    },
    onError: () => notify.error(isAr ? 'فشل الإغلاق' : 'Close failed'),
  });
  const closeRegistration = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      api(`/courses/${id}/${open ? 'open-registration' : 'close-registration'}`, { method: 'POST' }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      notify.success(
        vars.open
          ? isAr
            ? 'تم فتح التسجيل'
            : 'Registration opened'
          : isAr
            ? 'تم إغلاق التسجيل يدوياً'
            : 'Registration closed manually',
      );
    },
    onError: () => notify.error(isAr ? 'فشلت العملية' : 'Action failed'),
  });
  const archive = useMutation({
    mutationFn: (id: string) => api(`/courses/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      notify.success(isAr ? 'تمت الأرشفة' : 'Course archived');
    },
    onError: () => notify.error(isAr ? 'فشلت الأرشفة' : 'Archive failed'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      notify.success(isAr ? 'تم الحذف' : 'Course deleted');
    },
    onError: () => notify.error(isAr ? 'فشل الحذف' : 'Delete failed'),
  });

  useEffect(() => {
    if (!isEdit || !data) return;
    const c = data.find((item) => item.id === id);
    if (!c) {
      notify.error(isAr ? 'الدورة غير موجودة' : 'Course not found');
      navigate('/courses');
      return;
    }
    const en = c.translations?.find((item) => item.locale === 'en');
    setFormError(null);
    setForm({
      title: c.title,
      slug: c.slug,
      description: c.description,
      overview: c.overview,
      objectives: c.objectives.join('\n'),
      requirements: c.requirements.join('\n'),
      duration: c.duration,
      level: c.level,
      price: c.price != null ? String(c.price) : '',
      currency: c.currency || 'IQD',
      certificate: c.certificate || '',
      coverUrl: c.coverUrl || '',
      registrationStartsAt: toDatetimeLocal(c.registrationStartsAt),
      registrationEndsAt: toDatetimeLocal(c.registrationEndsAt),
      en_title: en?.title || '',
      en_description: en?.description || '',
      en_overview: en?.overview || '',
      en_objectives: en?.objectives?.join('\n') || '',
      en_requirements: en?.requirements?.join('\n') || '',
      en_duration: en?.duration || '',
      en_certificate: en?.certificate || '',
    });
    setFormReady(true);
  }, [isEdit, data, id, isAr, navigate]);

  function edit(c: Course) {
    navigate(`/courses/${c.id}/edit`);
  }

  const statusLabel = (status: string) => {
    if (status === 'PUBLISHED') return isAr ? 'منشور' : 'Published';
    if (status === 'CLOSED') return isAr ? 'مغلق' : 'Closed';
    if (status === 'ARCHIVED') return isAr ? 'مؤرشف' : 'Archived';
    return isAr ? 'مسودة' : 'Draft';
  };

  if (isForm) {
    if (isEdit && !formReady) {
      return <p className="admin-page text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>;
    }

    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow={isAr ? 'الأكاديمية' : 'Academy'}
          title={isEdit ? (isAr ? 'تعديل دورة' : 'Edit course') : isAr ? 'إضافة دورة' : 'Add course'}
          description={
            isAr
              ? 'املأ العربية والإنجليزية ثم احفظ. رجوع للقائمة بعد الحفظ.'
              : 'Fill Arabic and English, then save. You return to the list after saving.'
          }
        />

        <form
          className="admin-panel admin-form-card"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[var(--color-ink)]">
                {isAr ? 'بيانات الدورة' : 'Course details'}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {isAr ? 'العربية والإنجليزية إلزاميتان قبل الحفظ.' : 'Arabic and English are required before saving.'}
              </p>
            </div>
            <div className="flex gap-2">
              <LocalePill locale="ar" complete={Boolean(form.title.trim())} />
              <LocalePill locale="en" complete={Boolean(form.en_title.trim())} />
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input id="slug" label="Slug *" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Select id="level" label={isAr ? 'المستوى *' : 'Level *'} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="STUDENTS">{isAr ? 'طلاب' : 'Students'}</option>
              <option value="BASIC">{isAr ? 'أساسي' : 'Basic'}</option>
              <option value="ADVANCED">{isAr ? 'متقدم' : 'Advanced'}</option>
            </Select>
            <Input
              id="price"
              label={isAr ? 'السعر' : 'Price'}
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder={isAr ? 'مثال: 250000' : 'e.g. 250000'}
            />
            <Select
              id="currency"
              label={isAr ? 'العملة' : 'Currency'}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="IQD">{isAr ? 'دينار عراقي (IQD)' : 'Iraqi Dinar (IQD)'}</option>
              <option value="USD">{isAr ? 'دولار (USD)' : 'US Dollar (USD)'}</option>
            </Select>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <Input
              id="registrationStartsAt"
              label={isAr ? 'بداية التسجيل' : 'Registration start'}
              type="datetime-local"
              value={form.registrationStartsAt}
              onChange={(e) => setForm({ ...form, registrationStartsAt: e.target.value })}
            />
            <Input
              id="registrationEndsAt"
              label={isAr ? 'نهاية التسجيل' : 'Registration end'}
              type="datetime-local"
              value={form.registrationEndsAt}
              onChange={(e) => setForm({ ...form, registrationEndsAt: e.target.value })}
            />
          </div>

          <MediaImageField
            id="coverUrl"
            label={isAr ? 'صورة الغلاف' : 'Cover image'}
            value={form.coverUrl}
            onChange={(coverUrl) => setForm({ ...form, coverUrl })}
            className="mb-5"
          />

          <div className="bilingual-grid">
            <section className="bilingual-column">
              <header>
                <strong>العربية *</strong>
                <span>عربي فقط</span>
              </header>
              <Input id="title" label="العنوان *" value={form.title} onChange={(e) => setForm({ ...form, title: filterArabicOnly(e.target.value) })} />
              <Textarea id="description" label="الوصف *" value={form.description} onChange={(e) => setForm({ ...form, description: filterArabicOnly(e.target.value) })} />
              <Textarea id="overview" label="نظرة عامة *" value={form.overview} onChange={(e) => setForm({ ...form, overview: filterArabicOnly(e.target.value) })} />
              <Textarea id="objectives" label="الأهداف * (سطر لكل هدف)" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: filterArabicOnly(e.target.value) })} />
              <Textarea id="requirements" label="المتطلبات *" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: filterArabicOnly(e.target.value) })} />
              <Input id="duration" label="المدة *" value={form.duration} onChange={(e) => setForm({ ...form, duration: filterArabicOnly(e.target.value) })} />
              <Input id="certificate" label="نص الشهادة" value={form.certificate} onChange={(e) => setForm({ ...form, certificate: filterArabicOnly(e.target.value) })} />
            </section>

            <section className="bilingual-column is-en">
              <header>
                <strong>English *</strong>
                <span>English only</span>
              </header>
              <Input id="en_title" label="Title *" value={form.en_title} onChange={(e) => setForm({ ...form, en_title: filterEnglishOnly(e.target.value) })} />
              <Textarea id="en_description" label="Description *" value={form.en_description} onChange={(e) => setForm({ ...form, en_description: filterEnglishOnly(e.target.value) })} />
              <Textarea id="en_overview" label="Overview *" value={form.en_overview} onChange={(e) => setForm({ ...form, en_overview: filterEnglishOnly(e.target.value) })} />
              <Textarea id="en_objectives" label="Objectives * (one per line)" value={form.en_objectives} onChange={(e) => setForm({ ...form, en_objectives: filterEnglishOnly(e.target.value) })} />
              <Textarea id="en_requirements" label="Requirements *" value={form.en_requirements} onChange={(e) => setForm({ ...form, en_requirements: filterEnglishOnly(e.target.value) })} />
              <Input id="en_duration" label="Duration *" value={form.en_duration} onChange={(e) => setForm({ ...form, en_duration: filterEnglishOnly(e.target.value) })} />
              <Input id="en_certificate" label="Certificate text" value={form.en_certificate} onChange={(e) => setForm({ ...form, en_certificate: filterEnglishOnly(e.target.value) })} />
            </section>
          </div>

          {formError ? <p className="form-error mt-4">{formError}</p> : null}

          <div className="admin-form-footer">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isEdit
                  ? isAr
                    ? 'حفظ التعديل'
                    : 'Save changes'
                  : isAr
                    ? 'إنشاء الدورة'
                    : 'Create course'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/courses">{isAr ? 'رجوع للقائمة' : 'Back to list'}</Link>
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? 'الأكاديمية' : 'Academy'}
        title={isAr ? 'الدورات' : 'Courses'}
        description={
          isAr
            ? 'من هنا تشوف كل الدورات. إضافة جديدة صفحة لوحدها، وتعديل صفحة لوحدها.'
            : 'See all courses here. Add and edit each open on their own page.'
        }
      />

      <section className="admin-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{isAr ? 'قائمة الدورات' : 'Course list'}</h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr ? 'اضغط تعديل لتفتح صفحة التعديل، أو إضافة دورة جديدة.' : 'Click Edit to open the edit page, or add a new course.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-muted)]">
              {data?.length || 0}
            </span>
            <Button type="button" size="sm" asChild>
              <Link to="/courses/new">{isAr ? '+ إضافة دورة' : '+ Add course'}</Link>
            </Button>
          </div>
        </div>
        {isLoading ? <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}
        <div className="overflow-x-auto">
          <table className="dc-table">
            <thead>
              <tr>
                <th>{isAr ? 'العنوان' : 'Title'}</th>
                <th>{isAr ? 'السعر' : 'Price'}</th>
                <th>{isAr ? 'اللغات' : 'Languages'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((c) => {
                const complete = hasCompleteTranslation(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <strong className="block text-sm">{c.title}</strong>
                      <span className="text-xs text-[var(--color-ink-muted)]">{c.slug}</span>
                    </td>
                    <td className="text-sm font-semibold">
                      {c.price != null
                        ? `${c.price.toLocaleString(isAr ? 'ar-IQ' : 'en-US')} ${c.currency || 'IQD'}`
                        : '—'}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <LocalePill locale="ar" complete />
                        <LocalePill locale="en" complete={complete} />
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip status-${c.status.toLowerCase()}`}>{statusLabel(c.status)}</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Button type="button" size="sm" variant="secondary" onClick={() => edit(c)}>
                          {isAr ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setFormCourse(c)}>
                          {isAr ? 'فورم التسجيل' : 'Reg. form'}
                        </Button>
                        <Button type="button" size="sm" variant="accent" onClick={() => publish.mutate(c.id)}>
                          {isAr ? 'نشر' : 'Publish'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => closeCourse.mutate(c.id)}>
                          {isAr ? 'إغلاق' : 'Close'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            closeRegistration.mutate({
                              id: c.id,
                              open: Boolean(c.registrationClosedManually),
                            })
                          }
                        >
                          {c.registrationClosedManually
                            ? isAr
                              ? 'فتح التسجيل'
                              : 'Open reg.'
                            : isAr
                              ? 'إغلاق التسجيل'
                              : 'Close reg.'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => archive.mutate(c.id)}>
                          {isAr ? 'أرشفة' : 'Archive'}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => remove.mutate(c.id)}>
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
      </section>

      <CourseFormBuilderModal
        open={Boolean(formCourse)}
        courseId={formCourse?.id || ''}
        courseTitle={formCourse?.title || ''}
        onClose={() => setFormCourse(null)}
      />
    </div>
  );
}
