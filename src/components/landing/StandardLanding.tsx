import { FitLab } from './FitLab'
import {
  CapabilityRegister,
  IterationTwoFinalAction,
  IterationTwoHeader,
  IterationTwoHeroCopy,
  OpenMeasurementFigure,
  OpenProvenance,
  OpenWorkflow,
  type LandingIterationTwoProps,
} from './LandingIterationTwoShared'

export function StandardLanding(props: LandingIterationTwoProps) {
  return (
    <div className="landing-v2 landing-v2--standard" data-concept="standard">
      <IterationTwoHeader {...props} />
      <main>
        <section className="landing-v2-standard-hero" aria-labelledby="landing-title">
          <IterationTwoHeroCopy concept="standard" {...props} />
          <OpenMeasurementFigure label="One constraint, made legible" />
        </section>
        <CapabilityRegister intro="A conventional product flow, without turning each capability into its own floating container." />
        <section className="landing-v2-demo" aria-label="Working product example">
          <div className="landing-v2-demo__introduction">
            <p className="landing-v2-kicker">Try the underlying measurement</p>
            <h2>Change the text. Change the width. See the result.</h2>
          </div>
          <FitLab />
        </section>
        <OpenWorkflow />
        <OpenProvenance />
        <IterationTwoFinalAction {...props} />
      </main>
    </div>
  )
}
