import { readFileSync } from 'node:fs'
import { createRef } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '../components/ui/badge'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert'
import { Button, buttonVariants } from '../components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible'
import { Toggle } from '../components/ui/toggle'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../components/ui/toggle-group'

const globalsCss = readFileSync(
  `${process.cwd()}/src/styles/globals.css`,
  'utf8'
)

describe('design-system primitive contracts', () => {
  it('forwards refs through Base UI-backed wrappers under React 18', () => {
    const buttonRef = createRef<HTMLElement>()
    const badgeRef = createRef<HTMLSpanElement>()
    const separatorRef = createRef<HTMLDivElement>()
    const alertRef = createRef<HTMLDivElement>()
    const triggerRef = createRef<HTMLButtonElement>()
    const panelRef = createRef<HTMLDivElement>()
    const toggleRef = createRef<HTMLButtonElement>()
    const toggleGroupRef = createRef<HTMLDivElement>()
    const toggleGroupItemRef = createRef<HTMLButtonElement>()

    render(
      <>
        <Button ref={buttonRef}>Open editor</Button>
        <Badge ref={badgeRef}>Local</Badge>
        <Separator ref={separatorRef} />
        <Alert ref={alertRef} variant="warningDeck" role="status">
          <AlertTitle>Cannot fit</AlertTitle>
          <AlertDescription>Shorten content.</AlertDescription>
        </Alert>
        <Collapsible defaultOpen>
          <CollapsibleTrigger ref={triggerRef}>
            Fit constraints
          </CollapsibleTrigger>
          <CollapsibleContent ref={panelRef}>Controls</CollapsibleContent>
        </Collapsible>
        <Toggle ref={toggleRef}>Pinned</Toggle>
        <ToggleGroup ref={toggleGroupRef} defaultValue={['system']}>
          <ToggleGroupItem ref={toggleGroupItemRef} value="system">
            System
          </ToggleGroupItem>
        </ToggleGroup>
      </>
    )

    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement)
    expect(badgeRef.current).toBeInstanceOf(HTMLSpanElement)
    expect(separatorRef.current).toBeInstanceOf(HTMLDivElement)
    expect(alertRef.current).toBeInstanceOf(HTMLDivElement)
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement)
    expect(panelRef.current).toBeInstanceOf(HTMLDivElement)
    expect(toggleRef.current).toBeInstanceOf(HTMLButtonElement)
    expect(toggleGroupRef.current).toBeInstanceOf(HTMLDivElement)
    expect(toggleGroupItemRef.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('passes vertical orientation through to Base UI keyboard behavior', async () => {
    const { getByRole } = render(
      <ToggleGroup orientation="vertical" defaultValue={['system']}>
        <ToggleGroupItem value="system">System</ToggleGroupItem>
        <ToggleGroupItem value="light">Light</ToggleGroupItem>
      </ToggleGroup>
    )
    const system = getByRole('button', { name: 'System' })
    const light = getByRole('button', { name: 'Light' })

    system.focus()
    fireEvent.keyDown(system, { key: 'ArrowDown' })

    await waitFor(() => expect(light).toHaveFocus())
  })

  it('forwards refs through every Card wrapper under React 18', () => {
    const cardRef = createRef<HTMLDivElement>()
    const headerRef = createRef<HTMLDivElement>()
    const titleRef = createRef<HTMLDivElement>()
    const descriptionRef = createRef<HTMLDivElement>()
    const actionRef = createRef<HTMLDivElement>()
    const contentRef = createRef<HTMLDivElement>()
    const footerRef = createRef<HTMLDivElement>()

    render(
      <Card ref={cardRef}>
        <CardHeader ref={headerRef}>
          <CardTitle ref={titleRef}>Title</CardTitle>
          <CardDescription ref={descriptionRef}>Description</CardDescription>
          <CardAction ref={actionRef}>Action</CardAction>
        </CardHeader>
        <CardContent ref={contentRef}>Content</CardContent>
        <CardFooter ref={footerRef}>Footer</CardFooter>
      </Card>
    )

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement)
    expect(headerRef.current).toBeInstanceOf(HTMLDivElement)
    expect(titleRef.current).toBeInstanceOf(HTMLDivElement)
    expect(descriptionRef.current).toBeInstanceOf(HTMLDivElement)
    expect(actionRef.current).toBeInstanceOf(HTMLDivElement)
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement)
    expect(footerRef.current).toBeInstanceOf(HTMLDivElement)
  })

  it('uses the semantic primary hover token for default buttons', () => {
    expect.soft(buttonVariants({ variant: 'default' })).toContain(
      'hover:bg-primary-hover'
    )
    expect.soft(globalsCss).toContain(
      '--color-primary-hover: var(--primary-hover);'
    )
  })

  it('exposes the Precision Workbench font, surface, and geometry tokens', () => {
    expect(globalsCss).toContain('font-family: "Geist"')
    expect(globalsCss).toContain('--surface-raised: #ffffff;')
    expect(globalsCss).toContain('--surface-raised: #202825;')
    expect(globalsCss).toContain('--radius-structural: 2px;')
    expect(globalsCss).toContain('--radius-control: 4px;')
  })

})
