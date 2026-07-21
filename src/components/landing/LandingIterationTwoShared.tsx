import { BrandMark } from '@/components/BrandMark'
import { ThemeControl } from '@/components/ThemeControl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ITERATION_TWO_CAPABILITIES,
  ITERATION_TWO_HERO,
  ITERATION_TWO_WORKFLOW,
  PROJECT_ORIGIN,
  type LandingIterationTwoConcept,
} from './landingIterationTwoContent'
import { PROVENANCE } from './landingContent'

export type LandingIterationTwoProps = {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

function actionLabel(hasSavedResume: boolean, freshLabel: string) {
  return hasSavedResume ? 'Continue editing' : freshLabel
}

export function IterationTwoHeader({
  hasSavedResume,
  onOpenEditor,
}: LandingIterationTwoProps) {
  return (
    <header className="landing-v2-header" aria-label="Presume landing navigation">
      <a className="landing-v2-brand" href="/presume/" aria-label="Presume home">
        <BrandMark />
        <span>Presume</span>
      </a>
      <div className="landing-v2-header__actions">
        <ThemeControl />
        <Button variant="outline" onClick={onOpenEditor}>
          {actionLabel(hasSavedResume, 'Open editor')}
        </Button>
      </div>
    </header>
  )
}

export function IterationTwoHeroCopy({
  concept,
  hasSavedResume,
  onOpenEditor,
}: LandingIterationTwoProps & { concept: LandingIterationTwoConcept }) {
  const hero = ITERATION_TWO_HERO[concept]

  return (
    <div className="landing-v2-hero-copy">
      <p className="landing-v2-kicker">{hero.eyebrow}</p>
      <h1 id="landing-title">{hero.title}</h1>
      <p className="landing-v2-hero-copy__description">{hero.description}</p>
      <div className="landing-v2-hero-copy__actions">
        <Button size="lg" onClick={onOpenEditor}>
          {actionLabel(hasSavedResume, 'Start editing')}
        </Button>
        <span>No account · Stored locally · JSON backup</span>
      </div>
    </div>
  )
}

export function OpenMeasurementFigure({ label = 'Constraint study' }: { label?: string }) {
  return (
    <figure className="landing-v2-measurement" data-slot="hero-mechanics">
      <figcaption>{label}</figcaption>
      <div className="landing-v2-measurement__sample">
        <span className="landing-v2-measurement__start">0</span>
        <p>A precise tool makes invisible constraints visible before they become surprises.</p>
        <span className="landing-v2-measurement__limit">240</span>
      </div>
      <div className="landing-v2-measurement__rule" aria-hidden="true">
        <span />
      </div>
      <dl>
        <div><dt>Measured</dt><dd>3 lines</dd></div>
        <div><dt>Target</dt><dd>2 lines</dd></div>
        <div><dt>Status</dt><dd>Adjust</dd></div>
      </dl>
    </figure>
  )
}

export function CapabilityRegister({ intro }: { intro: string }) {
  return (
    <section className="landing-v2-section landing-v2-capabilities" aria-labelledby="capabilities-title">
      <div className="landing-v2-section-heading">
        <p className="landing-v2-kicker">What the workbench controls</p>
        <h2 id="capabilities-title">The document stays central from first edit to final export.</h2>
        <p>{intro}</p>
      </div>
      <ol className="landing-v2-register">
        {ITERATION_TWO_CAPABILITIES.map((item, index) => (
          <li key={item.title} data-slot="capability-row">
            <span>0{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function OpenWorkflow({ editorial = false }: { editorial?: boolean }) {
  return (
    <section className="landing-v2-section landing-v2-workflow" aria-labelledby="workflow-title">
      <div className="landing-v2-section-heading">
        <p className="landing-v2-kicker">{editorial ? 'Operating sequence' : 'How it works'}</p>
        <h2 id="workflow-title">Write → Measure → Review → Export</h2>
        <p>Review is optional. Every other stage remains available without a configured service.</p>
      </div>
      <ol>
        {ITERATION_TWO_WORKFLOW.map(([title, description], index) => (
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
  )
}

export function OpenProvenance({ colophon = false }: { colophon?: boolean }) {
  return (
    <section className="landing-v2-section landing-v2-provenance" aria-labelledby="provenance-title">
      <div className="landing-v2-section-heading">
        <p className="landing-v2-kicker">{colophon ? 'Colophon / source notes' : 'Open-source foundations'}</p>
        <h2 id="provenance-title">The important influences are part of the story.</h2>
        <p>
          Pretext informs the measurement layer. HackerRank's Hiring Agent informs
          the optional advisory boundary. Presume makes both roles explicit.
        </p>
      </div>
      <div className="landing-v2-provenance__list">
        {PROVENANCE.map((item, index) => (
          <article key={item.source}>
            <span>[{index + 1}]</span>
            <div>
              <p className="landing-v2-provenance__source">{item.source}</p>
              <h3>{item.heading}</h3>
              <p>{item.description}</p>
              <a href={item.href}>{item.linkLabel}<span aria-hidden="true"> ↗</span></a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ProjectNarrative({ concise = false }: { concise?: boolean }) {
  return (
    <section
      className={`landing-v2-section landing-v2-origins${concise ? ' landing-v2-origins--concise' : ''}`}
      aria-labelledby="origins-title"
    >
      <div className="landing-v2-origins__heading">
        <p className="landing-v2-kicker">Why Presume exists</p>
        <h2 id="origins-title">The document came first.</h2>
        <p>{PROJECT_ORIGIN.introduction}</p>
      </div>
      <div className="landing-v2-origins__chapters">
        <section>
          <span>01 / Measurement</span>
          <h3>Pretext made fit observable.</h3>
          <p>{PROJECT_ORIGIN.pretext}</p>
          <a href={PROVENANCE[0].href}>Explore Pretext<span aria-hidden="true"> ↗</span></a>
        </section>
        <section>
          <span>02 / Advisory review</span>
          <h3>Hiring Agent made the review boundary tangible.</h3>
          <p>{PROJECT_ORIGIN.hiringAgent}</p>
          <a href={PROVENANCE[1].href}>Explore Hiring Agent<span aria-hidden="true"> ↗</span></a>
        </section>
      </div>
    </section>
  )
}

export function IterationTwoFinalAction({
  hasSavedResume,
  onOpenEditor,
}: LandingIterationTwoProps) {
  return (
    <section className="landing-v2-final" aria-labelledby="final-action-title">
      <div>
        <p className="landing-v2-kicker">The workbench is ready</p>
        <h2 id="final-action-title">Open the document and start where the work happens.</h2>
      </div>
      <Button size="lg" onClick={onOpenEditor}>
        {actionLabel(hasSavedResume, 'Open the editor')}
      </Button>
    </section>
  )
}
