import { FitLab } from './FitLab'
import {
  HeroCopy,
  HeroMechanics,
  LandingFinalAction,
  LandingHeader,
  PrecisionLedger,
  Provenance,
  Workflow,
  type LandingCompositionProps,
} from './LandingShared'

function ManualChapter({
  number,
  label,
  children,
}: {
  number: string
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="landing-manual-chapter" aria-label={`${number} ${label}`}>
      <div className="landing-manual-chapter__label">
        <span>{number}</span>
        <strong>{label}</strong>
      </div>
      <div className="landing-manual-chapter__body">{children}</div>
    </section>
  )
}

export function OpenTechnicalManualLanding(props: LandingCompositionProps) {
  return (
    <div className="landing-page landing-page--manual" data-concept="manual">
      <LandingHeader {...props} />
      <main className="landing-main landing-manual">
        <section className="landing-hero landing-hero--manual" aria-labelledby="landing-title">
          <div className="landing-manual__folio">01 / Overview</div>
          <HeroCopy concept="manual" {...props} />
          <HeroMechanics caption="Figure 01 · Constraint model" />
        </section>
        <ManualChapter number="02" label="Capabilities">
          <PrecisionLedger label="A compact specification of the working surface." />
        </ManualChapter>
        <ManualChapter number="03" label="Worked example">
          <FitLab />
        </ManualChapter>
        <ManualChapter number="04" label="Procedure">
          <Workflow title="A four-stage operating procedure." procedure />
        </ManualChapter>
        <ManualChapter number="05" label="Source notes">
          <Provenance sourceNotes />
        </ManualChapter>
        <LandingFinalAction {...props} />
      </main>
    </div>
  )
}
