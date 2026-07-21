import { FitLab } from './FitLab'
import {
  CapabilityRegister,
  IterationTwoFinalAction,
  IterationTwoHeader,
  IterationTwoHeroCopy,
  OpenWorkflow,
  ProjectNarrative,
  type LandingIterationTwoProps,
} from './LandingIterationTwoShared'

export function StandardLanding(props: LandingIterationTwoProps) {
  return (
    <div className="landing-v2 landing-v2--standard" data-concept="standard">
      <IterationTwoHeader {...props} />
      <main>
        <section className="landing-v2-readme-hero" aria-labelledby="landing-title">
          <IterationTwoHeroCopy concept="standard" {...props} />
          <div className="landing-v2-readme-hero__demo">
            <div className="landing-v2-readme-hero__demo-label">
              <span>Live system 01</span>
              <strong>Text geometry</strong>
            </div>
            <FitLab />
          </div>
        </section>
        <CapabilityRegister intro="A technical product flow organized around the work, not around marketing tiles." />
        <OpenWorkflow />
        <ProjectNarrative concise />
        <IterationTwoFinalAction {...props} />
      </main>
    </div>
  )
}
