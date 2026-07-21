import { Button } from '@/components/ui/button'
import type { LandingIterationTwoProps } from './LandingIterationTwoShared'
import type { FolioHeroVariant } from './landingIterationTwoContent'

const PHOTOS = {
  quiet: {
    src: '/presume/landing/handmade-paper.jpg',
    href: 'https://unsplash.com/photos/DsPYLmU4Ty0',
    credit: '360floralflaves',
  },
  direct: {
    src: '/presume/landing/printing-machine.jpg',
    href: 'https://unsplash.com/photos/Tzm3Oyu_6sk',
    credit: 'Bank Phrom',
  },
  abstract: {
    src: '/presume/landing/letterpress-type.jpg',
    href: 'https://unsplash.com/photos/ZieTVo0mbzM',
    credit: 'Bret Lama',
  },
} as const

function HeroAction({
  hasSavedResume,
  onOpenEditor,
}: LandingIterationTwoProps) {
  return (
    <Button size="lg" onClick={onOpenEditor}>
      {hasSavedResume ? 'Continue editing' : 'Open the editor'}
    </Button>
  )
}

function PhotoCredit({ variant }: { variant: FolioHeroVariant }) {
  const photo = PHOTOS[variant]

  return (
    <a
      className="folio-hero__credit"
      href={photo.href}
      target="_blank"
      rel="noreferrer"
    >
      Photograph: {photo.credit} / Unsplash
    </a>
  )
}

function QuietProjectHero(props: LandingIterationTwoProps) {
  return (
    <section
      className="folio-hero folio-hero--quiet"
      data-slot="folio-hero"
      data-hero="quiet"
      aria-labelledby="landing-title"
    >
      <img src={PHOTOS.quiet.src} alt="" aria-hidden="true" />
      <div className="folio-hero--quiet__content">
        <p className="landing-v2-kicker">Presume</p>
        <h1 id="landing-title">Presume is a local-first resume workbench.</h1>
        <p>
          A personal resume project developed into a complete tool for direct
          editing, measurable fit, optional review, and stable export.
        </p>
        <div className="folio-hero__actions">
          <HeroAction {...props} />
          <span>Open project · No account required</span>
        </div>
      </div>
      <PhotoCredit variant="quiet" />
    </section>
  )
}

function DirectProductHero(props: LandingIterationTwoProps) {
  return (
    <section
      className="folio-hero folio-hero--direct"
      data-slot="folio-hero"
      data-hero="direct"
      aria-labelledby="landing-title"
    >
      <div className="folio-hero--direct__copy">
        <p className="landing-v2-kicker">A document-led editor</p>
        <h1 id="landing-title">Edit the document. Measure the result.</h1>
        <p>
          Presume keeps writing, fit guidance, optional advisory evidence, and
          export on the same local-first surface.
        </p>
        <div className="folio-hero__actions">
          <HeroAction {...props} />
          <span>Stored in this browser</span>
        </div>
      </div>
      <div className="folio-hero--direct__image">
        <img src={PHOTOS.direct.src} alt="" aria-hidden="true" />
        <p aria-hidden="true">Input / measure / resolve / export</p>
        <PhotoCredit variant="direct" />
      </div>
    </section>
  )
}

function TechnicalAbstractHero(props: LandingIterationTwoProps) {
  return (
    <section
      className="folio-hero folio-hero--abstract"
      data-slot="folio-hero"
      data-hero="abstract"
      aria-labelledby="landing-title"
    >
      <div className="folio-hero--abstract__heading">
        <p className="landing-v2-kicker">Technical abstract</p>
        <h1 id="landing-title">
          A working document, with its constraints left visible.
        </h1>
      </div>
      <div className="folio-hero--abstract__summary">
        <p>
          Presume treats the resume as the primary interface. Text measurement,
          advisory review, persistence, and export remain supporting systems
          rather than replacements for the document.
        </p>
        <div className="folio-hero__actions">
          <HeroAction {...props} />
          <span>Project note · Browser / PDF</span>
        </div>
      </div>
      <div className="folio-hero--abstract__plate">
        <img src={PHOTOS.abstract.src} alt="" aria-hidden="true" />
        <div aria-hidden="true">
          <span>Source</span>
          <strong>Document</strong>
          <span>Boundary</span>
          <strong>Observable</strong>
          <span>Output</span>
          <strong>Stable</strong>
        </div>
        <PhotoCredit variant="abstract" />
      </div>
    </section>
  )
}

export function FolioHero({
  variant,
  ...props
}: LandingIterationTwoProps & { variant: FolioHeroVariant }) {
  if (variant === 'direct') return <DirectProductHero {...props} />
  if (variant === 'abstract') return <TechnicalAbstractHero {...props} />
  return <QuietProjectHero {...props} />
}
