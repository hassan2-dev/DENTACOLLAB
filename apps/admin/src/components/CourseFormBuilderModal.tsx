import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Input, Select, Textarea } from '@dentacollab/ui';
import { api } from '../lib/api';
import { useAdminPreferences } from './AdminLayout';
import { Button } from './ui/button';
import { notify } from '../lib/toast';

export type CourseFormField = {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  type: 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'SELECT';
  required: boolean;
  options: Array<{ ar: string; en: string; value: string }> | unknown;
  sortOrder: number;
  width: string;
};

type FieldDraft = {
  key: string;
  labelAr: string;
  labelEn: string;
  placeholderAr: string;
  placeholderEn: string;
  type: CourseFormField['type'];
  required: boolean;
  width: 'half' | 'full';
  optionsText: string;
};

const emptyDraft = (): FieldDraft => ({
  key: '',
  labelAr: '',
  labelEn: '',
  placeholderAr: '',
  placeholderEn: '',
  type: 'TEXT',
  required: true,
  width: 'half',
  optionsText: '',
});

function parseOptions(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [ar, en, value] = line.split('|').map((part) => part.trim());
      const labelAr = ar || line;
      const labelEn = en || ar || line;
      return { ar: labelAr, en: labelEn, value: value || labelEn || labelAr };
    });
}

function optionsToText(options: CourseFormField['options']) {
  if (!Array.isArray(options)) return '';
  return options
    .map((item: any) => {
      if (!item || typeof item !== 'object') return String(item);
      return `${item.ar || ''}|${item.en || ''}|${item.value || ''}`;
    })
    .join('\n');
}

const TYPE_LABELS: Record<CourseFormField['type'], { ar: string; en: string }> = {
  TEXT: { ar: 'نص', en: 'Text' },
  TEXTAREA: { ar: 'مربع نص', en: 'Textarea' },
  EMAIL: { ar: 'بريد', en: 'Email' },
  PHONE: { ar: 'هاتف', en: 'Phone' },
  NUMBER: { ar: 'رقم', en: 'Number' },
  SELECT: { ar: 'قائمة', en: 'Select' },
};

export function CourseFormBuilderModal({
  courseId,
  courseTitle,
  open,
  onClose,
}: {
  courseId: string;
  courseTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const { language } = useAdminPreferences();
  const isAr = language === 'ar';
  const qc = useQueryClient();
  const [fieldPopup, setFieldPopup] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<CourseFormField | null>(null);
  const [draft, setDraft] = useState<FieldDraft>(emptyDraft());
  const [confirmDelete, setConfirmDelete] = useState<CourseFormField | null>(null);

  const fields = useQuery({
    queryKey: ['course-form-fields', courseId],
    queryFn: () => api<CourseFormField[]>(`/courses/${courseId}/form-fields`),
    enabled: open && Boolean(courseId),
  });

  useEffect(() => {
    if (!open) {
      setFieldPopup(null);
      setEditing(null);
      setDraft(emptyDraft());
      setConfirmDelete(null);
    }
  }, [open]);

  const saveField = useMutation({
    mutationFn: async () => {
      const payload = {
        key: draft.key.trim() || undefined,
        labelAr: draft.labelAr.trim(),
        labelEn: draft.labelEn.trim(),
        placeholderAr: draft.placeholderAr.trim() || undefined,
        placeholderEn: draft.placeholderEn.trim() || undefined,
        type: draft.type,
        required: draft.required,
        width: draft.width,
        options: draft.type === 'SELECT' ? parseOptions(draft.optionsText) : [],
      };
      if (!payload.labelAr || !payload.labelEn) {
        throw new Error(isAr ? 'التسميتان العربية والإنجليزية مطلوبتان' : 'Arabic and English labels are required');
      }
      if (fieldPopup === 'edit' && editing) {
        return api(`/courses/${courseId}/form-fields/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return api(`/courses/${courseId}/form-fields`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-form-fields', courseId] });
      setFieldPopup(null);
      setEditing(null);
      setDraft(emptyDraft());
      notify.success(isAr ? 'تم حفظ الحقل' : 'Field saved');
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الحفظ' : 'Save failed')),
  });

  const removeField = useMutation({
    mutationFn: (fieldId: string) =>
      api(`/courses/${courseId}/form-fields/${fieldId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-form-fields', courseId] });
      setConfirmDelete(null);
      notify.success(isAr ? 'تم حذف الحقل' : 'Field deleted');
    },
    onError: (err: Error) => notify.error(err.message || (isAr ? 'فشل الحذف' : 'Delete failed')),
  });

  const resetFields = useMutation({
    mutationFn: () => api(`/courses/${courseId}/form-fields/reset`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-form-fields', courseId] });
      notify.success(isAr ? 'تمت إعادة الحقول الافتراضية' : 'Default fields restored');
    },
    onError: () => notify.error(isAr ? 'فشلت إعادة التعيين' : 'Reset failed'),
  });

  const moveField = useMutation({
    mutationFn: async (orderedIds: string[]) =>
      api(`/courses/${courseId}/form-fields/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['course-form-fields', courseId] }),
    onError: () => notify.error(isAr ? 'فشل إعادة الترتيب' : 'Reorder failed'),
  });

  if (!open) return null;

  function openAdd() {
    setEditing(null);
    setDraft(emptyDraft());
    setFieldPopup('add');
  }

  function openEdit(field: CourseFormField) {
    setEditing(field);
    setDraft({
      key: field.key,
      labelAr: field.labelAr,
      labelEn: field.labelEn,
      placeholderAr: field.placeholderAr || '',
      placeholderEn: field.placeholderEn || '',
      type: field.type,
      required: field.required,
      width: field.width === 'full' ? 'full' : 'half',
      optionsText: optionsToText(field.options),
    });
    setFieldPopup('edit');
  }

  function move(index: number, direction: -1 | 1) {
    const list = [...(fields.data || [])];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const tmp = list[index];
    list[index] = list[target];
    list[target] = tmp;
    moveField.mutate(list.map((item) => item.id));
  }

  return (
    <div className="admin-popup-root" role="dialog" aria-modal="true">
      <button type="button" className="admin-popup-backdrop" aria-label="Close" onClick={onClose} />
      <div className="admin-popup-panel admin-popup-panel-lg">
        <div className="admin-popup-head">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-brand)]">
              {isAr ? 'فورم التسجيل' : 'Registration form'}
            </p>
            <h3 className="mt-1 text-lg font-black text-[var(--color-ink)]">{courseTitle}</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {isAr
                ? 'خصّص الحقول المطلوبة لهذه الدورة. الاسم والهاتف والبريد لا يمكن حذفها.'
                : 'Customize required fields for this course. Name, phone, and email cannot be deleted.'}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </div>

        <div className="admin-popup-body space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="accent" onClick={openAdd}>
              {isAr ? 'إضافة حقل' : 'Add field'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={resetFields.isPending}
              onClick={() => resetFields.mutate()}
            >
              {isAr ? 'إعادة الافتراضي' : 'Reset defaults'}
            </Button>
          </div>

          {fields.isLoading ? (
            <p className="text-sm text-[var(--color-ink-muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : null}

          <ul className="space-y-2">
            {(fields.data || []).map((field, index) => {
              const locked = ['fullName', 'phone', 'email'].includes(field.key);
              return (
                <li
                  key={field.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3"
                >
                  <div className="min-w-0">
                    <strong className="block text-sm text-[var(--color-ink)]">
                      {isAr ? field.labelAr : field.labelEn}
                    </strong>
                    <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
                      {field.key} · {TYPE_LABELS[field.type][isAr ? 'ar' : 'en']} ·{' '}
                      {field.required ? (isAr ? 'مطلوب' : 'Required') : isAr ? 'اختياري' : 'Optional'}
                      {field.width === 'full' ? ` · ${isAr ? 'عرض كامل' : 'Full width'}` : ''}
                    </p>
                  </div>
                  <div className="admin-row-actions">
                    <Button type="button" size="sm" variant="outline" onClick={() => move(index, -1)}>
                      ↑
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => move(index, 1)}>
                      ↓
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(field)}>
                      {isAr ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={locked}
                      onClick={() => setConfirmDelete(field)}
                    >
                      {isAr ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {fieldPopup ? (
        <div className="admin-popup-root admin-popup-nested" role="dialog" aria-modal="true">
          <button type="button" className="admin-popup-backdrop" aria-label="Close" onClick={() => setFieldPopup(null)} />
          <div className="admin-popup-panel">
            <div className="admin-popup-head">
              <h4 className="text-base font-black">
                {fieldPopup === 'edit' ? (isAr ? 'تعديل حقل' : 'Edit field') : isAr ? 'حقل جديد' : 'New field'}
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={() => setFieldPopup(null)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
            <div className="admin-popup-body grid gap-3 sm:grid-cols-2">
              <Input
                id="ff-label-ar"
                label={isAr ? 'التسمية عربي *' : 'Arabic label *'}
                value={draft.labelAr}
                onChange={(e) => setDraft({ ...draft, labelAr: e.target.value.replace(/[A-Za-z\u00C0-\u024F]/g, '') })}
              />
              <Input
                id="ff-label-en"
                label={isAr ? 'التسمية إنجليزي *' : 'English label *'}
                value={draft.labelEn}
                onChange={(e) => setDraft({ ...draft, labelEn: e.target.value.replace(/[\u0600-\u06FF]/g, '') })}
              />
              <Input
                id="ff-key"
                label={isAr ? 'المفتاح (اختياري)' : 'Key (optional)'}
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              />
              <Select
                id="ff-type"
                label={isAr ? 'النوع' : 'Type'}
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as CourseFormField['type'] })}
              >
                {Object.entries(TYPE_LABELS).map(([value, labels]) => (
                  <option key={value} value={value}>
                    {labels[isAr ? 'ar' : 'en']}
                  </option>
                ))}
              </Select>
              <Input
                id="ff-ph-ar"
                label={isAr ? 'Placeholder عربي' : 'Arabic placeholder'}
                value={draft.placeholderAr}
                onChange={(e) => setDraft({ ...draft, placeholderAr: e.target.value })}
              />
              <Input
                id="ff-ph-en"
                label={isAr ? 'Placeholder إنجليزي' : 'English placeholder'}
                value={draft.placeholderEn}
                onChange={(e) => setDraft({ ...draft, placeholderEn: e.target.value })}
              />
              <Select
                id="ff-width"
                label={isAr ? 'العرض' : 'Width'}
                value={draft.width}
                onChange={(e) => setDraft({ ...draft, width: e.target.value as 'half' | 'full' })}
              >
                <option value="half">{isAr ? 'نصف' : 'Half'}</option>
                <option value="full">{isAr ? 'كامل' : 'Full'}</option>
              </Select>
              <Select
                id="ff-required"
                label={isAr ? 'الإلزام' : 'Required'}
                value={draft.required ? '1' : '0'}
                onChange={(e) => setDraft({ ...draft, required: e.target.value === '1' })}
              >
                <option value="1">{isAr ? 'مطلوب' : 'Required'}</option>
                <option value="0">{isAr ? 'اختياري' : 'Optional'}</option>
              </Select>
              {draft.type === 'SELECT' ? (
                <div className="sm:col-span-2">
                  <Textarea
                    id="ff-options"
                    label={isAr ? 'الخيارات (سطر لكل خيار: عربي|إنجليزي|قيمة)' : 'Options (one per line: ar|en|value)'}
                    rows={4}
                    value={draft.optionsText}
                    onChange={(e) => setDraft({ ...draft, optionsText: e.target.value })}
                  />
                </div>
              ) : null}
            </div>
            <div className="admin-popup-foot">
              <Button type="button" disabled={saveField.isPending} onClick={() => saveField.mutate()}>
                {saveField.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ الحقل' : 'Save field'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="admin-popup-root admin-popup-nested" role="dialog" aria-modal="true">
          <button type="button" className="admin-popup-backdrop" aria-label="Close" onClick={() => setConfirmDelete(null)} />
          <div className="admin-popup-panel admin-popup-panel-sm">
            <div className="admin-popup-head">
              <h4 className="text-base font-black">{isAr ? 'تأكيد الحذف' : 'Confirm delete'}</h4>
            </div>
            <div className="admin-popup-body">
              <p className="text-sm text-[var(--color-ink-muted)]">
                {isAr
                  ? `حذف الحقل «${confirmDelete.labelAr}» من فورم هذه الدورة؟`
                  : `Delete field “${confirmDelete.labelEn}” from this course form?`}
              </p>
            </div>
            <div className="admin-popup-foot flex gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(null)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={removeField.isPending}
                onClick={() => removeField.mutate(confirmDelete.id)}
              >
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
