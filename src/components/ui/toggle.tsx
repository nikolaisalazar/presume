import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-[var(--radius-control)] text-sm font-semibold whitespace-nowrap outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--duration-standard)] ease-[var(--ease-standard)] hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:ring-2 focus-visible:ring-focus-contrast disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:outline-destructive aria-pressed:bg-surface-raised aria-pressed:text-foreground aria-pressed:shadow-[var(--shadow-control-edge)] data-[state=on]:bg-surface-raised data-[state=on]:text-foreground data-[state=on]:shadow-[var(--shadow-control-edge)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-border bg-surface-pressed text-muted-foreground hover:border-border-strong hover:bg-muted",
      },
      size: {
        default:
          "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-8 min-w-8 px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        appearance: "h-11 min-w-11 px-2.5 text-xs min-[561px]:h-8 min-[561px]:min-w-8",
        lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ToggleProps = Omit<TogglePrimitive.Props, "ref"> &
  VariantProps<typeof toggleVariants>

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) {
  return (
    <TogglePrimitive
      ref={ref}
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Toggle.displayName = "Toggle"

export { Toggle, toggleVariants }
