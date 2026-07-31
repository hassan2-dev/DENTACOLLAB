import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fb6d1]/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#101c38] text-white hover:bg-[#1a2d55]',
        secondary: 'border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]',
        outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface)]',
        ghost: 'hover:bg-[var(--color-surface)] text-[var(--color-ink)]',
        accent: 'bg-[#1fb6d1] text-white hover:bg-[#1899b3]',
        destructive: 'bg-[#e5485d] text-white hover:bg-[#d03d50]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
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
