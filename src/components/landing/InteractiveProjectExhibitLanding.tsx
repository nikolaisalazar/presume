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

export function InteractiveProjectExhibitLanding(props: LandingCompositionProps) {
  return (
    <div className="landing-page landing-page--exhibit" data-concept="exhibit">
      <LandingHeader {...props} />
      <main className="landing-main landing-exhibit">
        <section className="landing-hero landing-hero--exhibit" aria-labelledby="landing-title">
          <HeroCopy concept="exhibit" {...props} />
          <div className="landing-system-flow" aria-label="Presume system flow">
            <div className="landing-system-flow__inputs">
              <span>Direct input</span>
              <span>Pretext measure</span>
            </div>
            <HeroMechanics caption="Presume measurement boundary" />
            <div className="landing-system-flow__outputs">
              <span>Optional evidence</span>
              <span>Stable artifact</span>
            </div>
          </div>
        </section>
        <section className="landing-exhibit__proof" aria-label="Working proof">
          <div className="landing-exhibit__proof-label">
            <span>01</span>
            <strong>Try the measurement layer</strong>
          </div>
          <FitLab />
        </section>
        <PrecisionLedger label="The Presume-owned surface around those open foundations." />
        <Provenance />
        <Workflow title="Open foundations resolve into a user-controlled workflow." />
        <LandingFinalAction {...props} />
      </main>
    </div>
  )
}
