import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BrandMark } from '@/components/BrandMark'
import { ThemeControl } from '@/components/ThemeControl'
import {
  CAPABILITIES,
  HERO_CONTENT,
  PROVENANCE,
  WORKFLOW_STEPS,
  type LandingConcept,
} from './landingContent'

export type LandingCompositionProps = {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

export function LandingHeader({
  hasSavedResume,
  onOpenEditor,
}: LandingCompositionProps) {
  return (
    <header className="landing-header" aria-label="Presume landing navigation">
      <a
        className="landing-nav__brand"
        href="/presume/"
        aria-label="Presume home"
      >
        <BrandMark />
        <span>Presume</span>
      </a>
      <div className="landing-header__actions">
        <ThemeControl />
        <Button
          variant="outline"
          className="landing-header__action"
          onClick={onOpenEditor}
        >
          {hasSavedResume ? 'Continue editing' : 'Open editor'}
        </Button>
      </div>
    </header>
  )
}

export function HeroCopy({
  concept,
  hasSavedResume,
  onOpenEditor,
}: LandingCompositionProps & { concept: LandingConcept }) {
  const content = HERO_CONTENT[concept]

  return (
    <div className="landing-hero__copy">
      <p className="landing-kicker">{content.eyebrow}</p>
      <h1 id="landing-title">{content.title}</h1>
      <p className="landing-hero__description">{content.description}</p>
      <div className="landing-hero__actions">
        <Button size="lg" onClick={onOpenEditor}>
          {hasSavedResume ? 'Continue editing' : 'Start editing'}
        </Button>
        <div className="landing-hero__assurance">
          <Badge variant="outline">No account required</Badge>
          <span>Stored locally in your browser</span>
        </div>
      </div>
    </div>
  )
}

export function HeroMechanics({ caption }: { caption: string }) {
  return (
    <figure className="landing-mechanics" data-slot="hero-mechanics">
      <figcaption>{caption}</figcaption>
      <div className="landing-mechanics__readout">
        <span>WIDTH</span>
        <strong>240px</strong>
      </div>
      <div className="landing-mechanics__field">
        <p>A precise tool makes invisible constraints visible before they become surprises.</p>
        <span className="landing-mechanics__boundary" aria-hidden="true" />
      </div>
      <div className="landing-mechanics__rule" aria-hidden="true">
        <span />
      </div>
      <dl className="landing-mechanics__metrics">
        <div><dt>Lines</dt><dd>3</dd></div>
        <div><dt>Target</dt><dd>2</dd></div>
        <div><dt>Result</dt><dd>Adjust</dd></div>
      </dl>
    </figure>
  )
}

export function PrecisionLedger({
  label = 'Product capabilities',
}: { label?: string }) {
  return (
    <section className="landing-ledger-section" aria-labelledby="landing-ledger-title">
      <div className="landing-section-heading">
        <p className="landing-kicker">Precision ledger</p>
        <h2 id="landing-ledger-title">Four capabilities, one controlled surface.</h2>
        <p>{label}</p>
      </div>
      <div className="landing-ledger">
        {CAPABILITIES.map((capability, index) => (
          <Card key={capability.title} size="sm">
            <CardHeader>
              <span className="landing-ledger__index">0{index + 1}</span>
              <CardTitle><h3>{capability.title}</h3></CardTitle>
              <CardDescription><p>{capability.description}</p></CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function Workflow({
  title = 'From working copy to stable artifact.',
  procedure = false,
}: {
  title?: string
  procedure?: boolean
}) {
  return (
    <section className={`landing-workflow${procedure ? ' landing-workflow--procedure' : ''}`} aria-labelledby="landing-workflow-title">
      <div className="landing-section-heading">
        <p className="landing-kicker">{procedure ? 'Operating procedure' : 'Workflow'}</p>
        <h2 id="landing-workflow-title">{title}</h2>
      </div>
      <ol>
        {WORKFLOW_STEPS.map((step, index) => (
          <li key={step.title} data-slot="workflow-step">
            <span className="landing-workflow__index">0{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              {'optional' in step ? <Badge variant="outline">Optional</Badge> : null}
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Provenance({
  sourceNotes = false,
}: { sourceNotes?: boolean }) {
  return (
    <section className={`landing-provenance${sourceNotes ? ' landing-provenance--notes' : ''}`} aria-labelledby="landing-provenance-title">
      <div className="landing-section-heading">
        <p className="landing-kicker">Open-source provenance</p>
        <h2 id="landing-provenance-title">Built with visible foundations.</h2>
        <p>
          These projects shaped Presume's measurement and advisory Review layers.
          The editor, persistence, export, and service boundary remain Presume's own.
        </p>
      </div>
      <Separator />
      <div className="landing-provenance__sources">
        {PROVENANCE.map((item, index) => (
          <article key={item.source}>
            <div className="landing-provenance__meta">
              <span>Source 0{index + 1}</span>
              <strong>{item.source}</strong>
            </div>
            <div>
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

export function LandingFinalAction({
  hasSavedResume,
  onOpenEditor,
}: LandingCompositionProps) {
  return (
    <section className="landing-final" aria-labelledby="landing-final-title">
      <div>
        <p className="landing-kicker">Local by default</p>
        <h2 id="landing-final-title">A complete resume workbench, ready when you are.</h2>
        <p>
          Resume data stays in this browser unless you explicitly request a
          configured Review. JSON export gives you a backup you control.
        </p>
      </div>
      <Button size="lg" onClick={onOpenEditor}>
        {hasSavedResume ? 'Continue editing' : 'Open the editor'}
      </Button>
    </section>
  )
}
