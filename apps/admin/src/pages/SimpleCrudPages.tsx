import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
  type?: 'text' | 'textarea' | 'number' | 'select' | 'image';
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
  fields,
  mapRow,
}: {
  titleAr: string;
  titleEn: string;
  eyebrowAr: string;
  eyebrowEn: string;
  listKey: string;
  endpoint: string;
  fields: Field[];
  mapRow: (row: Record<string, unknown>) => string;
}) {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: [listKey],
    queryFn: () => api<Record<string, unknown>[]>(endpoint.includes('admin') ? endpoint : `${endpoint}/admin/all`.replace('//', '/')),
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const translatable = fields.filter((f) => f.translatable);
  const shared = fields.filter((f) => !f.translatable);

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
        if (f.type === 'number' && form[f.key] != null && form[f.key] !== '') {
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
      if (editingId) return api(`${base}/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      return api(base, { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      const wasEdit = Boolean(editingId);
      qc.invalidateQueries({ queryKey: [listKey] });
      setForm({});
      setEditingId(null);
      setFormError(null);
      notify.success(wasEdit ? (isAr ? 'تم الحفظ' : 'Saved') : isAr ? 'تمت الإضافة' : 'Added');
    },
    onError: (err: Error) => {
      notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed'));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`${endpoint.replace(/\/admin\/all$/, '')}/${id}`, { method: 'DELETE' }),
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

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow={isAr ? eyebrowAr : eyebrowEn}
        title={isAr ? titleAr : titleEn}
        description={
          isAr
            ? 'إدارة المحتوى الظاهر في الموقع.'
            : 'Manage public website content.'
        }
      />

      <section className="admin-panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{isAr ? 'القائمة' : 'List'}</h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr ? 'اختر عنصراً للتعديل أو أضف جديداً بالأسفل.' : 'Select an item to edit, or add a new one below.'}
            </p>
          </div>
          <span className="rounded-md bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-muted)]">
            {data?.length || 0}
          </span>
        </div>
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
                    <td>{mapRow(row)}</td>
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
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(String(row.id));
                            const next: Record<string, string> = {};
                            const en = getEnTranslation(row);
                            fields.forEach((f) => {
                              next[f.key] = String(row[f.key] ?? '');
                              if (f.translatable) next[`en_${f.key}`] = String(en[f.key] ?? '');
                            });
                            setForm(next);
                            setFormError(null);
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                          }}
                        >
                          {isAr ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => remove.mutate(String(row.id))}>
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

      <form
        className="admin-panel"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--color-ink)]">
              {editingId ? (isAr ? 'تعديل' : 'Edit') : isAr ? 'إضافة جديد' : 'Add new'}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr ? 'املأ الحقول المطلوبة ثم احفظ.' : 'Fill the required fields, then save.'}
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
              : editingId
                ? isAr
                  ? 'حفظ التعديل'
                  : 'Save changes'
                : isAr
                  ? 'إضافة'
                  : 'Add'}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({});
                setFormError(null);
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

export function InstructorsAdminPage() {
  return (
    <CrudBox
      titleAr="المدربون"
      titleEn="Instructors"
      eyebrowAr="الأكاديمية"
      eyebrowEn="Academy"
      listKey="admin-instructors"
      endpoint="/instructors/admin/all"
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
      fields={[
        { key: 'question', labelAr: 'السؤال', labelEn: 'Question', translatable: true },
        { key: 'answer', labelAr: 'الإجابة', labelEn: 'Answer', type: 'textarea', translatable: true },
        { key: 'category', labelAr: 'التصنيف', labelEn: 'Category', translatable: true },
      ]}
      mapRow={(r) => String(r.question)}
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
      fields={[
        { key: 'name', labelAr: 'الاسم', labelEn: 'Name', translatable: true },
        { key: 'profession', labelAr: 'المهنة', labelEn: 'Profession', translatable: true },
        { key: 'rating', labelAr: 'التقييم', labelEn: 'Rating', type: 'number' },
        { key: 'review', labelAr: 'الرأي', labelEn: 'Review', type: 'textarea', translatable: true },
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
      fields={[
        { key: 'fullName', labelAr: 'الاسم', labelEn: 'Full name', translatable: true },
        { key: 'courseTitle', labelAr: 'الدورة التي أخذها', labelEn: 'Course taken', translatable: true },
        { key: 'rating', labelAr: 'التقييم (1-5)', labelEn: 'Rating (1-5)', type: 'number' },
        { key: 'graduationDate', labelAr: 'تاريخ التخرج', labelEn: 'Graduation date' },
        { key: 'description', labelAr: 'ماذا أنجز / مشروعه', labelEn: 'What they did / project', type: 'textarea', translatable: true },
        { key: 'imageUrl', labelAr: 'الصورة', labelEn: 'Image', type: 'image' },
        { key: 'certificateUrl', labelAr: 'صورة الشهادة', labelEn: 'Certificate image', type: 'image' },
      ]}
      mapRow={(r) => `${r.fullName} — ${r.courseTitle || ''} ★${r.rating ?? 5}`}
    />
  );
}
