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

function FolioSection({
  number,
  label,
  children,
}: {
  number: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="landing-v2-folio-section">
      <aside>
        <span>{number}</span>
        <strong>{label}</strong>
      </aside>
      <div>{children}</div>
    </div>
  )
}

export function TechnicalFolioLanding(props: LandingIterationTwoProps) {
  return (
    <div className="landing-v2 landing-v2--folio" data-concept="folio">
      <IterationTwoHeader {...props} />
      <main>
        <section className="landing-v2-folio-hero" aria-labelledby="landing-title">
          <div className="landing-v2-folio-hero__margin-note">
            <span>Project</span>
            <strong>Presume</strong>
            <span>Medium</span>
            <strong>Browser / PDF</strong>
            <span>Storage</span>
            <strong>Local first</strong>
          </div>
          <IterationTwoHeroCopy concept="folio" {...props} />
          <OpenMeasurementFigure label="Fig. 01 / text geometry" />
        </section>
        <FolioSection number="02" label="Working surface">
          <CapabilityRegister intro="Four responsibilities arranged as a register, not a collection of feature tiles." />
        </FolioSection>
        <FolioSection number="03" label="Live specimen">
          <FitLab />
        </FolioSection>
        <FolioSection number="04" label="Sequence">
          <OpenWorkflow editorial />
        </FolioSection>
        <FolioSection number="05" label="Source notes">
          <OpenProvenance colophon />
        </FolioSection>
        <IterationTwoFinalAction {...props} />
      </main>
    </div>
  )
}
