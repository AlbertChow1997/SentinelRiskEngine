// Based on the shadcn/ui Badge (new-york, Tailwind v4), restyled with Sentinel Pay tokens.
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        outline: 'text-foreground',
        brand: 'bg-accent text-accent-foreground border-transparent',
        'risk-low': 'bg-risk-low-surface text-risk-low border-risk-low/30',
        'risk-medium': 'bg-risk-medium-surface text-risk-medium border-risk-medium/30',
        'risk-high': 'bg-risk-high-surface text-risk-high border-risk-high/30',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
export type { BadgeProps }
