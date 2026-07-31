export function LocalePill({ locale, complete }: { locale: 'ar' | 'en'; complete?: boolean }) {
  return (
    <span className={`locale-pill ${complete === false ? 'is-missing' : 'is-ok'}`}>
      {locale.toUpperCase()}
      {complete === false ? ' ✕' : ' ✓'}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="admin-page-desc">{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </div>
  );
}
