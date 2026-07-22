import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-transparent bg-clip-padding text-xs font-semibold whitespace-nowrap outline-none select-none shadow-[var(--shadow-control-edge)] transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duration-standard)] ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:ring-2 focus-visible:ring-focus-contrast active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border-border bg-surface-raised text-foreground hover:border-border-strong hover:bg-muted aria-expanded:border-border-strong aria-expanded:bg-muted",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-muted aria-expanded:bg-muted aria-expanded:text-secondary-foreground",
        ghost:
          "shadow-none hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:outline-destructive",
        link: "text-accent-foreground underline-offset-4 hover:underline",
        dangerOutline:
          "border-border bg-surface-raised text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
        reviewCategory:
          "h-auto min-h-18 w-full flex-col items-stretch gap-1 rounded-[var(--radius-control)] border-border bg-background px-2.5 py-2 text-left whitespace-normal hover:border-primary/45 hover:bg-muted/60 aria-pressed:border-primary aria-pressed:bg-primary/6 aria-pressed:ring-1 aria-pressed:ring-primary/20",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8",
        "icon-lg": "size-9",
        editor: "h-11 px-3.5 min-[561px]:h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = Omit<ButtonPrimitive.Props, "ref"> &
  VariantProps<typeof buttonVariants>

const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", ...props },
  ref
) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
