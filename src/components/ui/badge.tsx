import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        active:
          'bg-success-tint text-success border border-success/20 dark:bg-success/15 dark:text-emerald-400',
        disabled:
          'bg-danger-tint text-danger border border-danger/20 dark:bg-danger/15 dark:text-rose-400',
        expired:
          'bg-canvas text-muted border border-border dark:bg-canvas-dark dark:text-muted-dark dark:border-border-dark',
        limited:
          'bg-warning-tint text-warning border border-warning/20 dark:bg-warning/15 dark:text-amber-400',
        brand:
          'bg-brand-tint text-brand border border-brand/20 dark:bg-brand/15 dark:text-cyan-400',
        neutral:
          'bg-canvas text-ink-soft border border-border dark:bg-surface-dark dark:text-muted-dark dark:border-border-dark',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && variant === 'active' && (
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
