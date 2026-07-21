import { FitLab } from './FitLab'
import { FolioHero } from './FolioHeroVariants'
import {
  CapabilityRegister,
  IterationTwoFinalAction,
  IterationTwoHeader,
  OpenWorkflow,
  ProjectNarrative,
  type LandingIterationTwoProps,
} from './LandingIterationTwoShared'
import { getFolioHeroVariant } from './landingIterationTwoContent'

export function TechnicalFolioLanding(props: LandingIterationTwoProps) {
  const hero = getFolioHeroVariant(window.location.search)

  return (
    <div className="landing-v2 landing-v2--folio" data-concept="folio">
      <IterationTwoHeader {...props} />
      <main>
        <FolioHero variant={hero} {...props} />
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
