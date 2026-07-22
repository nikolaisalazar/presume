import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'
import { FitLab } from '@/components/landing/FitLab'
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

const WORKFLOW = [
  ['Write', 'Work directly on the live document.'],
  ['Measure', 'Expose wrapping and page pressure.'],
  ['Review', 'Optionally inspect advisory evidence.'],
  ['Export', 'Create the PDF or carry the data forward.'],
] as const

function editorActionLabel(hasSavedResume: boolean, freshLabel: string) {
  return hasSavedResume ? 'Continue editing' : freshLabel
}

export function LandingPage({ hasSavedResume, onOpenEditor }: LandingPageProps) {
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
          aria-labelledby="landing-title"
        >
          <picture
            className="landing-hero__media"
            data-slot="landing-hero-media"
            aria-hidden="true"
          >
            <source
              media="(min-width: 641px)"
              type="image/webp"
              srcSet="/presume/landing/handmade-paper-1120.webp 1120w, /presume/landing/handmade-paper-2200.webp 2200w"
              sizes="(max-width: 1120px) calc(100vw - 48px), 1120px"
            />
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
          <a
            className="landing-hero__credit"
            href="https://unsplash.com/photos/DsPYLmU4Ty0"
            target="_blank"
            rel="noreferrer"
          >
            Photograph: 360floralflaves / Unsplash
          </a>
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
            <section>
              <span>01 / Measurement</span>
              <h3>Pretext made fit observable.</h3>
              <p>
                Cheng Lou&apos;s Pretext made the measurement layer both possible
                and legible. Presume uses its text-layout primitives to reason
                about multiline wrapping and exposes that relationship in the Fit
                Lab instead of hiding it behind marketing language.
              </p>
              <a href="https://github.com/chenglou/pretext">
                Explore Pretext<span aria-hidden="true"> ↗</span>
              </a>
            </section>
            <section>
              <span>02 / Advisory review</span>
              <h3>Hiring Agent made the review boundary tangible.</h3>
              <p>
                HackerRank&apos;s open-source Hiring Agent helped make an
                evidence-oriented Review workflow concrete. Presume adapts that
                idea behind an optional service boundary, presents the result as
                advisory evidence, and never lets it rewrite the resume.
              </p>
              <a href="https://github.com/interviewstreet/hiring-agent">
                Explore Hiring Agent<span aria-hidden="true"> ↗</span>
              </a>
            </section>
          </div>
        </section>

        <section className="landing-fit-study" aria-label="Working product example">
          <div className="landing-fit-study__introduction">
            <p className="landing-kicker">A working example</p>
            <h2>Pretext, exposed as a small experiment.</h2>
            <p>Change either input and inspect the line geometry Presume receives.</p>
          </div>
          <FitLab />
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

        <section className="landing-workflow" aria-labelledby="workflow-title">
          <div className="landing-section-heading">
            <p className="landing-kicker">Operating sequence</p>
            <h2 id="workflow-title">Write → Measure → Review → Export</h2>
            <p>
              Review is optional. Every other stage remains available without a
              configured service.
            </p>
          </div>
          <ol>
            {WORKFLOW.map(([title, description], index) => (
              <li key={title} data-slot="workflow-step">
                <span>0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  {title === 'Review' ? <Badge variant="outline">Optional</Badge> : null}
                  <p>{description}</p>
                </div>
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
