import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const map: Record<Variant, string> = {
  primary: 'dc-btn dc-btn-primary',
  secondary: 'dc-btn dc-btn-secondary',
  ghost: 'dc-btn dc-btn-ghost',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: PropsWithChildren<Props>) {
  return (
    <button className={`${map[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
