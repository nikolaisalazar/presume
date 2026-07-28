import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'
import { PretextLivingFlow } from '@/components/landing/PretextLivingFlow'
import { ThemeControl } from '@/components/ThemeControl'

export interface LandingPageProps {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

const CAPABILITIES = [
  {
    title: 'Write on the document',
    description:
      'Edit names, dates, sections, and bullets where they appear instead of translating them through a separate form.',
  },
  {
    title: 'Measure while it changes',
    description:
      'Page count, line wrapping, and minimum type size remain visible while the content is still editable.',
  },
  {
    title: 'Review as evidence',
    description:
      'When configured, Review returns category scores and supporting evidence without rewriting your words.',
  },
  {
    title: 'Leave with a stable artifact',
    description:
      'Export a Letter-size PDF or a portable JSON backup from the same source used by the editor.',
  },
] as const

function editorActionLabel(hasSavedResume: boolean, freshLabel: string) {
  return hasSavedResume ? 'Continue editing' : freshLabel
}

function subscribeToViewport(listener: () => void) {
  window.addEventListener('resize', listener)
  return () => window.removeEventListener('resize', listener)
}

function getWideViewportSnapshot() {
  return window.innerWidth >= 641
}

export function LandingPage({ hasSavedResume, onOpenEditor }: LandingPageProps) {
  const isWide = useSyncExternalStore(
    subscribeToViewport,
    getWideViewportSnapshot,
    () => false
  )

  return (
    <div className="landing-page">
      <header
        className="landing-page__header"
        aria-label="Presume landing navigation"
      >
        <a className="landing-page__brand" href="/presume/" aria-label="Presume home">
          <BrandMark />
          <span>Presume</span>
        </a>
        <div className="landing-page__header-actions">
          <ThemeControl />
          <Button variant="outline" onClick={onOpenEditor}>
            {editorActionLabel(hasSavedResume, 'Open editor')}
          </Button>
        </div>
      </header>

      <main className="landing-page__main">
        <section
          className="landing-hero"
          data-slot="landing-hero"
          data-layout={isWide ? 'wide' : 'compact'}
          aria-labelledby="landing-title"
        >
          <picture
            className="landing-hero__media"
            data-slot="landing-hero-media"
            aria-hidden="true"
          >
            {isWide ? (
              <source
                type="image/webp"
                srcSet="/presume/landing/document-horizon-1120.webp 1120w, /presume/landing/document-horizon-2200.webp 2200w"
                sizes="(max-width: 1120px) calc(100vw - 48px), 1120px"
              />
            ) : null}
            <img
              src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
              alt=""
              width="1120"
              height="720"
            />
          </picture>
          <div className="landing-hero__content">
            <p className="landing-kicker">Presume</p>
            <h1 id="landing-title">Presume is a local-first resume workbench.</h1>
            <p className="landing-hero__description">
              A personal resume project developed into a complete tool for direct
              editing, measurable fit, optional review, and stable export.
            </p>
            <div className="landing-hero__actions">
              <Button size="lg" onClick={onOpenEditor}>
                {editorActionLabel(hasSavedResume, 'Open the editor')}
              </Button>
              <span>Open project · No account required</span>
            </div>
          </div>
        </section>

        <section className="landing-origins" aria-labelledby="origins-title">
          <div className="landing-origins__heading">
            <p className="landing-kicker">Why Presume exists</p>
            <h2 id="origins-title">The document came first.</h2>
            <p>
              Most resume builders begin with a form and reconstruct a document
              afterward. Presume began with the opposite question: what if the
              document stayed live while every supporting system formed around it?
            </p>
          </div>
          <div className="landing-origins__chapters">
            <section className="landing-origins__chapter landing-origins__chapter--measurement">
              <header className="landing-origins__chapter-heading">
                <span>01 / Measurement</span>
                <h3>Pretext made fit observable.</h3>
              </header>
              <PretextLivingFlow
                actionsEnd={
                  <a href="https://github.com/chenglou/pretext">
                    Explore Pretext<span aria-hidden="true"> ↗</span>
                  </a>
                }
              />
            </section>
            <section className="landing-origins__chapter">
              <header className="landing-origins__chapter-heading">
                <span>02 / Advisory review</span>
                <h3>Hiring Agent made the review boundary tangible.</h3>
              </header>
              <p>
                HackerRank&apos;s open-source Hiring Agent helped make an
                evidence-oriented Review workflow concrete. Presume adapts that
                idea behind an optional service boundary, presents the result as
                advisory evidence, and never lets it rewrite the resume.
              </p>
              <footer className="landing-origins__chapter-footer">
                <a href="https://github.com/interviewstreet/hiring-agent">
                  Explore Hiring Agent<span aria-hidden="true"> ↗</span>
                </a>
              </footer>
            </section>
          </div>
        </section>

        <section className="landing-capabilities" aria-labelledby="capabilities-title">
          <div className="landing-section-heading">
            <p className="landing-kicker">What the workbench controls</p>
            <h2 id="capabilities-title">
              The document stays central from first edit to final export.
            </h2>
            <p>
              The project behaves like a complete product without pretending to
              be a conventional SaaS business.
            </p>
          </div>
          <ol className="landing-capabilities__register">
            {CAPABILITIES.map((item, index) => (
              <li key={item.title} data-slot="capability-row">
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-final" aria-labelledby="final-action-title">
          <div>
            <p className="landing-kicker">The workbench is ready</p>
            <h2 id="final-action-title">
              Open the document and start where the work happens.
            </h2>
          </div>
          <Button size="lg" onClick={onOpenEditor}>
            {editorActionLabel(hasSavedResume, 'Open the editor')}
          </Button>
        </section>
      </main>
    </div>
  )
}
