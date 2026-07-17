import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[var(--radius-control)] border border-transparent px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors duration-[var(--duration-standard)] ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:ring-2 focus-visible:ring-focus-contrast has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:outline-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:outline-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-accent-foreground underline-offset-4 hover:underline",
        reviewTier:
          "border-primary/35 bg-primary/5 text-accent-foreground",
        reviewWarning:
          "border-warning-border bg-warning-bg text-warning-ink",
        reviewInfo:
          "bg-review-bg text-review-ink",
        reviewStrong:
          "bg-review-success-bg text-review-success-ink",
      },
      size: {
        default: "",
        status: "h-[34px] px-3 text-xs font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type BadgeProps = Omit<useRender.ComponentProps<"span">, "ref"> &
  VariantProps<typeof badgeVariants>

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = "default", size = "default", render, ...props },
  ref
) {
  return useRender({
    defaultTagName: "span",
    ref,
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
      size,
    },
  })
})

Badge.displayName = "Badge"

export { Badge, badgeVariants }
