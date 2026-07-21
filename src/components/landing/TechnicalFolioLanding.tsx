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

export function TechnicalFolioLanding(props: LandingIterationTwoProps) {
  return (
    <div className="landing-v2 landing-v2--folio" data-concept="folio">
      <IterationTwoHeader {...props} />
      <main>
        <section className="landing-v2-lovable-hero" aria-labelledby="landing-title">
          <IterationTwoHeroCopy concept="folio" {...props} />
          <dl className="landing-v2-lovable-hero__metadata">
            <div><dt>Project</dt><dd>Presume</dd></div>
            <div><dt>Medium</dt><dd>Browser / PDF</dd></div>
            <div><dt>Storage</dt><dd>Local first</dd></div>
            <div><dt>Review</dt><dd>Optional evidence</dd></div>
          </dl>
        </section>
        <ProjectNarrative />
        <section className="landing-v2-lovable-demo" aria-label="Working product example">
          <div>
            <p className="landing-v2-kicker">A working example</p>
            <h2>Pretext, exposed as a small experiment.</h2>
            <p>Change either input and inspect the line geometry Presume receives.</p>
          </div>
          <FitLab />
        </section>
        <CapabilityRegister intro="The project now behaves like a complete product without pretending to be a conventional SaaS business." />
        <OpenWorkflow editorial />
        <IterationTwoFinalAction {...props} />
      </main>
    </div>
  )
}
