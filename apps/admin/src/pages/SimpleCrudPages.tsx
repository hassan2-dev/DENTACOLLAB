import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Input, Textarea, Select } from '@dentacollab/ui';
import { api } from '../lib/api';
import { useAdminPreferences } from '../components/AdminLayout';
import { LocalePill, PageHeader } from '../components/AdminUi';
import { MediaImageField } from '../components/MediaImageField';
import { Button } from '../components/ui/button';
import { bilingualErrorMessage, hasCompleteTranslation, missingBilingualFields } from '../lib/bilingual';
import { notify } from '../lib/toast';

type Field = {
  key: string;
  labelAr: string;
  labelEn: string;
  type?: 'text' | 'textarea' | 'number' | 'select' | 'image' | 'checkbox';
  options?: string[];
  translatable?: boolean;
};

function getEnTranslation(row: Record<string, unknown>) {
  const translations = (row.translations as Array<Record<string, unknown>> | undefined) || [];
  return translations.find((item) => item.locale === 'en') || {};
}

function CrudBox({
  titleAr,
  titleEn,
  eyebrowAr,
  eyebrowEn,
  listKey,
  endpoint,
  basePath,
  fields,
  mapRow,
}: {
  titleAr: string;
  titleEn: string;
  eyebrowAr: string;
  eyebrowEn: string;
  listKey: string;
  endpoint: string;
  basePath: string;
  fields: Field[];
  mapRow: (row: Record<string, unknown>) => string;
}) {
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
    queryKey: [listKey],
    queryFn: () =>
      api<Record<string, unknown>[]>(endpoint.includes('admin') ? endpoint : `${endpoint}/admin/all`.replace('//', '/')),
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [ready, setReady] = useState(!isEdit);
  const translatable = fields.filter((f) => f.translatable);
  const shared = fields.filter((f) => !f.translatable);

  useEffect(() => {
    if (!isEdit || !data) return;
    const row = data.find((item) => String(item.id) === id);
    if (!row) {
      notify.error(isAr ? 'العنصر غير موجود' : 'Item not found');
      navigate(basePath);
      return;
    }
    const next: Record<string, string> = {};
    const en = getEnTranslation(row);
    fields.forEach((f) => {
      next[f.key] = String(row[f.key] ?? '');
      if (f.translatable) next[`en_${f.key}`] = String(en[f.key] ?? '');
    });
    setForm(next);
    setReady(true);
  }, [isEdit, data, id, basePath, fields, isAr, navigate]);

  const bilingualMissing = useMemo(() => {
    if (!translatable.length) return [];
    return missingBilingualFields(
      translatable.map((f) => ({
        key: f.key,
        ar: form[f.key] || '',
        en: form[`en_${f.key}`] || '',
        labelAr: f.labelAr,
        labelEn: f.labelEn,
      })),
      language,
    );
  }, [form, language, translatable]);

  const save = useMutation({
    mutationFn: async () => {
      if (translatable.length && bilingualMissing.length) {
        const message = bilingualErrorMessage(bilingualMissing, language) || '';
        setFormError(message);
        throw new Error(message);
      }
      setFormError(null);

      const payload: Record<string, unknown> = {};
      fields.forEach((f) => {
        if (f.type === 'checkbox') {
          payload[f.key] = form[f.key] === 'true';
        } else if (f.type === 'number' && form[f.key] != null && form[f.key] !== '') {
          payload[f.key] = Number(form[f.key]);
        } else if (!f.key.startsWith('en_')) {
          payload[f.key] = typeof form[f.key] === 'string' ? form[f.key].trim() : form[f.key];
        }
      });

      if (translatable.length) {
        const enPayload: Record<string, unknown> = { locale: 'en' };
        translatable.forEach((f) => {
          enPayload[f.key] = String(form[`en_${f.key}`] || '').trim();
        });
        payload.translations = [enPayload];
      }

      const base = endpoint.replace(/\/admin\/all$/, '');
      if (isEdit && id) return api(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      return api(base, { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [listKey] });
      setFormError(null);
      notify.success(isEdit ? (isAr ? 'تم حفظ التعديل' : 'Changes saved') : isAr ? 'تمت الإضافة بنجاح' : 'Added successfully');
      navigate(basePath);
    },
    onError: (err: Error) => {
      notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    },
  });

  const remove = useMutation({
    mutationFn: (rowId: string) => api(`${endpoint.replace(/\/admin\/all$/, '')}/${rowId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [listKey] });
      notify.success(isAr ? 'تم الحذف' : 'Deleted');
    },
    onError: () => notify.error(isAr ? 'فشل الحذف' : 'Delete failed'),
  });

  function renderField(f: Field, key: string, label: string) {
    if (f.type === 'image') {
      return (
        <MediaImageField
          key={key}
          id={key}
          label={label}
          value={form[key] || ''}
          onChange={(url) => setForm({ ...form, [key]: url })}
        />
      );
    }
    if (f.type === 'textarea') {
      return (
        <Textarea
          key={key}
          id={key}
          label={label}
          value={form[key] || ''}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      );
    }
    if (f.type === 'select') {
      return (
        <Select
          key={key}
          id={key}
          label={label}
          value={form[key] || ''}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          {(f.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    }
    if (f.type === 'checkbox') {
      return (
        <label key={key} htmlFor={key} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]">
          <input
            id={key}
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
            checked={form[key] === 'true'}
            onChange={(e) => setForm({ ...form, [key]: e.target.checked ? 'true' : 'false' })}
          />
          <span>{label}</span>
        </label>
      );
    }
    return (
      <Input
        key={key}
        id={key}
        label={label}
        type={f.type === 'number' ? 'number' : 'text'}
        value={form[key] || ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    );
  }

  const firstTranslatable = translatable[0];
  const arReady = firstTranslatable ? Boolean(String(form[firstTranslatable.key] || '').trim()) : true;
  const enReady = firstTranslatable ? Boolean(String(form[`en_${firstTranslatable.key}`] || '').trim()) : true;

  if (isForm) {
    if (isEdit && !ready) {
      return <p className="admin-page text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>;
    }

    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow={isAr ? eyebrowAr : eyebrowEn}
          title={isEdit ? (isAr ? `تعديل — ${titleAr}` : `Edit — ${titleEn}`) : isAr ? `إضافة — ${titleAr}` : `Add — ${titleEn}`}
          description={
            isAr
              ? 'املأ الحقول بوضوح ثم احفظ. لا تحتاج خبرة تقنية.'
              : 'Fill the fields clearly, then save. No technical skills needed.'
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
                {isEdit ? (isAr ? 'نموذج التعديل' : 'Edit form') : isAr ? 'نموذج الإضافة' : 'Add form'}
              </h2>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {isAr ? 'الحقول المعلّمة ضرورية لإظهار المحتوى في الموقع.' : 'Marked fields are needed to show content on the site.'}
              </p>
            </div>
            {translatable.length ? (
              <div className="flex gap-2">
                <LocalePill locale="ar" complete={arReady} />
                <LocalePill locale="en" complete={enReady} />
              </div>
            ) : null}
          </div>

          {shared.length ? (
            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {shared.map((f) => renderField(f, f.key, `${isAr ? f.labelAr : f.labelEn}`))}
            </div>
          ) : null}

          {translatable.length ? (
            <div className="bilingual-grid">
              <section className="bilingual-column">
                <header>
                  <strong>العربية *</strong>
                  <span>Arabic</span>
                </header>
                {translatable.map((f) => renderField(f, f.key, `${f.labelAr} *`))}
              </section>
              <section className="bilingual-column is-en">
                <header>
                  <strong>English *</strong>
                  <span>الإنجليزية</span>
                </header>
                {translatable.map((f) => renderField(f, `en_${f.key}`, `${f.labelEn} *`))}
              </section>
            </div>
          ) : null}

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
                    ? 'حفظ الإضافة'
                    : 'Save new item'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(basePath)}>
              {isAr ? 'رجوع للقائمة' : 'Back to list'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? eyebrowAr : eyebrowEn}
        title={isAr ? titleAr : titleEn}
        description={
          isAr
            ? 'من هنا تشوف القائمة، تضيف عنصر جديد، أو تعدّل الموجود.'
            : 'View the list, add a new item, or edit an existing one.'
        }
      />

      <section className="admin-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{isAr ? 'القائمة' : 'List'}</h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr ? `${data?.length || 0} عنصر` : `${data?.length || 0} items`}
            </p>
          </div>
          <Button asChild>
            <Link to={`${basePath}/new`}>{isAr ? '+ إضافة جديد' : '+ Add new'}</Link>
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p> : null}

        <div className="overflow-x-auto">
          <table className="dc-table">
            <thead>
              <tr>
                <th>{isAr ? 'العنصر' : 'Item'}</th>
                {translatable.length ? <th>{isAr ? 'اللغات' : 'Languages'}</th> : null}
                <th>{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((row) => {
                const complete = hasCompleteTranslation(row as { translations?: Array<{ locale?: string }> });
                return (
                  <tr key={String(row.id)}>
                    <td className="font-semibold">{mapRow(row)}</td>
                    {translatable.length ? (
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <LocalePill locale="ar" complete />
                          <LocalePill locale="en" complete={complete} />
                        </div>
                      </td>
                    ) : null}
                    <td>
                      <div className="admin-row-actions">
                        <Button asChild size="sm" variant="secondary">
                          <Link to={`${basePath}/${String(row.id)}/edit`}>{isAr ? 'تعديل' : 'Edit'}</Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm(isAr ? 'هل تريد حذف هذا العنصر؟' : 'Delete this item?')) {
                              remove.mutate(String(row.id));
                            }
                          }}
                        >
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

        {!isLoading && !(data || []).length ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[var(--color-ink-muted)]">
              {isAr ? 'لا يوجد عناصر بعد. ابدأ بإضافة أول عنصر.' : 'No items yet. Start by adding the first one.'}
            </p>
            <Button asChild className="mt-4">
              <Link to={`${basePath}/new`}>{isAr ? 'إضافة الآن' : 'Add now'}</Link>
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function InstructorsAdminPage() {
  return (
    <CrudBox
      titleAr="المدربون"
      titleEn="Instructors"
      eyebrowAr="الأكاديمية"
      eyebrowEn="Academy"
      listKey="admin-instructors"
      endpoint="/instructors/admin/all"
      basePath="/instructors"
      fields={[
        { key: 'name', labelAr: 'الاسم', labelEn: 'Name', translatable: true },
        { key: 'title', labelAr: 'المسمى', labelEn: 'Title', translatable: true },
        { key: 'biography', labelAr: 'السيرة', labelEn: 'Biography', type: 'textarea', translatable: true },
        { key: 'experience', labelAr: 'الخبرة', labelEn: 'Experience', type: 'textarea', translatable: true },
        { key: 'imageUrl', labelAr: 'الصورة', labelEn: 'Image', type: 'image' },
      ]}
      mapRow={(r) => `${r.name} — ${r.title}`}
    />
  );
}

export function FaqAdminPage() {
  return (
    <CrudBox
      titleAr="الأسئلة الشائعة"
      titleEn="FAQ"
      eyebrowAr="المحتوى"
      eyebrowEn="Content"
      listKey="admin-faq"
      endpoint="/faq/admin/all"
      basePath="/faq"
      fields={[
        { key: 'question', labelAr: 'السؤال', labelEn: 'Question', translatable: true },
        { key: 'answer', labelAr: 'الجواب', labelEn: 'Answer', type: 'textarea', translatable: true },
        { key: 'category', labelAr: 'التصنيف', labelEn: 'Category', translatable: true },
      ]}
      mapRow={(r) => String(r.question || '')}
    />
  );
}

export function TestimonialsAdminPage() {
  return (
    <CrudBox
      titleAr="آراء المتدربين"
      titleEn="Testimonials"
      eyebrowAr="الأكاديمية"
      eyebrowEn="Academy"
      listKey="admin-testimonials"
      endpoint="/testimonials/admin/all"
      basePath="/testimonials"
      fields={[
        { key: 'name', labelAr: 'الاسم', labelEn: 'Name', translatable: true },
        { key: 'profession', labelAr: 'المهنة', labelEn: 'Profession', translatable: true },
        { key: 'review', labelAr: 'الرأي', labelEn: 'Review', type: 'textarea', translatable: true },
        { key: 'rating', labelAr: 'التقييم', labelEn: 'Rating', type: 'number' },
        { key: 'imageUrl', labelAr: 'الصورة', labelEn: 'Image', type: 'image' },
        { key: 'videoUrl', labelAr: 'فيديو', labelEn: 'Video URL' },
      ]}
      mapRow={(r) => `${r.name} (${r.rating}/5)`}
    />
  );
}

export function GraduatesAdminPage() {
  return (
    <CrudBox
      titleAr="الخريجون"
      titleEn="Graduates"
      eyebrowAr="الأكاديمية"
      eyebrowEn="Academy"
      listKey="admin-graduates"
      endpoint="/graduates/admin/all"
      basePath="/graduates"
      fields={[
        { key: 'fullName', labelAr: 'الاسم', labelEn: 'Full name', translatable: true },
        { key: 'courseTitle', labelAr: 'الدورة التي أخذها', labelEn: 'Course taken', translatable: true },
        { key: 'rating', labelAr: 'التقييم (1-5)', labelEn: 'Rating (1-5)', type: 'number' },
        { key: 'graduationDate', labelAr: 'تاريخ التخرج', labelEn: 'Graduation date' },
        {
          key: 'description',
          labelAr: 'رأي الخريج / قصة النجاح',
          labelEn: 'Graduate review / success story',
          type: 'textarea',
          translatable: true,
        },
        {
          key: 'featured',
          labelAr: 'عرض رأيه في الصفحة الرئيسية (قصص النجاح)',
          labelEn: 'Show review on homepage (success stories)',
          type: 'checkbox',
        },
        { key: 'imageUrl', labelAr: 'الصورة', labelEn: 'Image', type: 'image' },
        { key: 'certificateUrl', labelAr: 'صورة الشهادة', labelEn: 'Certificate image', type: 'image' },
      ]}
      mapRow={(r) =>
        `${r.fullName} — ${r.courseTitle || ''} ★${r.rating ?? 5}${r.featured ? ' · الرئيسية' : ''}`
      }
    />
  );
}
