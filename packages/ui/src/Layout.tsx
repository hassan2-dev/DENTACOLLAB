import type { PropsWithChildren } from 'react';

export function Badge({ children }: PropsWithChildren) {
  return <span className="dc-badge">{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="dc-empty">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function Container({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`dc-container ${className}`.trim()}>{children}</div>;
}
