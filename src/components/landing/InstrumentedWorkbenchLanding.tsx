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

export function InstrumentedWorkbenchLanding(props: LandingCompositionProps) {
  return (
    <div className="landing-page landing-page--workbench" data-concept="workbench">
      <LandingHeader {...props} />
      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <HeroCopy concept="workbench" {...props} />
          <HeroMechanics caption="Live constraint model" />
        </section>
        <PrecisionLedger label="Direct control from first edit to final export." />
        <Workflow />
        <FitLab />
        <Provenance />
        <LandingFinalAction {...props} />
      </main>
    </div>
  )
}
