import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none shadow-subtle',
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-white hover:bg-ink-soft dark:bg-surface dark:text-ink dark:hover:bg-border/40 border border-transparent',
        secondary:
          'bg-surface text-ink border border-border hover:bg-canvas dark:bg-surface-dark dark:text-white dark:border-border-dark dark:hover:bg-canvas-dark',
        outline:
          'bg-transparent text-ink border border-border hover:bg-canvas dark:text-white dark:border-border-dark dark:hover:bg-canvas-dark',
        ghost:
          'bg-transparent text-ink hover:bg-canvas dark:text-white dark:hover:bg-canvas-dark shadow-none',
        destructive:
          'bg-danger text-white hover:bg-danger/90 border border-transparent shadow-subtle',
        destructiveOutline:
          'bg-surface text-danger border border-danger/30 hover:bg-danger-tint hover:border-danger dark:bg-surface-dark shadow-subtle',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
