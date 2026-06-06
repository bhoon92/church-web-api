import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral:
          'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
        muted:
          'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
        accent:
          'bg-[color-mix(in_oklch,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]',
        success: 'bg-emerald-50 text-emerald-700',
        warn: 'bg-amber-50 text-amber-700',
        danger: 'bg-rose-50 text-rose-700',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, className }))} {...props} />
  )
}
