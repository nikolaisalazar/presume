import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import * as React from "react"

const Collapsible = React.forwardRef<
  HTMLDivElement,
  Omit<CollapsiblePrimitive.Root.Props, "ref">
>(function Collapsible(props, ref) {
  return <CollapsiblePrimitive.Root ref={ref} data-slot="collapsible" {...props} />
})

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  Omit<CollapsiblePrimitive.Trigger.Props, "ref">
>(function CollapsibleTrigger(props, ref) {
  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      data-slot="collapsible-trigger"
      {...props}
    />
  )
})

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  Omit<CollapsiblePrimitive.Panel.Props, "ref">
>(function CollapsibleContent(props, ref) {
  return (
    <CollapsiblePrimitive.Panel
      ref={ref}
      data-slot="collapsible-content"
      {...props}
    />
  )
})

Collapsible.displayName = "Collapsible"
CollapsibleTrigger.displayName = "CollapsibleTrigger"
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
