import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

type FieldProps = {
  label: string;
  error?: string;
  id: string;
};

export function Input({
  label,
  error,
  id,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="dc-field">
      <label className="dc-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="dc-input" {...props} />
      {error ? <p className="dc-error">{error}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  error,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="dc-field">
      <label className="dc-label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="dc-textarea" rows={4} {...props} />
      {error ? <p className="dc-error">{error}</p> : null}
    </div>
  );
}

export function Select({
  label,
  error,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="dc-field">
      <label className="dc-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="dc-select" {...props}>
        {children}
      </select>
      {error ? <p className="dc-error">{error}</p> : null}
    </div>
  );
}
