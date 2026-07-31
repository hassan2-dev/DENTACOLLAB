import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-bold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#101c38] text-white',
        secondary: 'border-transparent bg-[var(--color-surface)] text-[var(--color-ink)]',
        outline: 'border-[var(--color-border)] text-[var(--color-ink-muted)]',
        success: 'border-transparent bg-[#e8f8f1] text-[#1a8f5c]',
        warning: 'border-transparent bg-[#fff3df] text-[#c07a10]',
        accent: 'border-transparent bg-[#e2f8fc] text-[#0f8aa3]',
        danger: 'border-transparent bg-[#ffecef] text-[#c9374c]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
