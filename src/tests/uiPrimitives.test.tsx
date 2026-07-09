import { readFileSync } from 'node:fs'
import { createRef } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '../components/ui/badge'
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

const globalsCss = readFileSync(
  `${process.cwd()}/src/styles/globals.css`,
  'utf8'
)

describe('design-system primitive contracts', () => {
  it('forwards refs through Base UI-backed wrappers under React 18', () => {
    const buttonRef = createRef<HTMLElement>()
    const badgeRef = createRef<HTMLSpanElement>()
    const separatorRef = createRef<HTMLDivElement>()

    render(
      <>
        <Button ref={buttonRef}>Open editor</Button>
        <Badge ref={badgeRef}>Local</Badge>
        <Separator ref={separatorRef} />
      </>
    )

    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement)
    expect(badgeRef.current).toBeInstanceOf(HTMLSpanElement)
    expect(separatorRef.current).toBeInstanceOf(HTMLDivElement)
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
})
