import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fb6d1]/35 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-brand)] text-white shadow-sm hover:brightness-95',
        secondary:
          'border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-ink)] shadow-sm hover:bg-[var(--color-surface)]',
        outline:
          'border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-ink)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]',
        ghost: 'hover:bg-[var(--color-surface)] text-[var(--color-ink)]',
        accent: 'bg-[var(--color-brand-dark)] text-white hover:opacity-90',
        destructive: 'bg-[#e5485d] text-white hover:bg-[#d03d50]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        lg: 'h-11 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
