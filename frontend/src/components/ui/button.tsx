// Based on the shadcn/ui Button (new-york, Tailwind v4), restyled with Sentinel Pay tokens.
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        brand: 'bg-brand text-brand-foreground hover:bg-brand/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        outline: 'border bg-background hover:bg-muted',
        ghost: 'hover:bg-muted text-muted-foreground hover:text-foreground',
        link: 'text-brand underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-10 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (for example a router Link) with button styles. */
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
