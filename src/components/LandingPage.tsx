import { InstrumentedWorkbenchLanding } from '@/components/landing/InstrumentedWorkbenchLanding'
import { InteractiveProjectExhibitLanding } from '@/components/landing/InteractiveProjectExhibitLanding'
import { OpenTechnicalManualLanding } from '@/components/landing/OpenTechnicalManualLanding'
import { getLandingConcept } from '@/components/landing/landingContent'

export interface LandingPageProps {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

export function LandingPage(props: LandingPageProps) {
  const concept = getLandingConcept(window.location.search)

  if (concept === 'manual') return <OpenTechnicalManualLanding {...props} />
  if (concept === 'exhibit') return <InteractiveProjectExhibitLanding {...props} />
  return <InstrumentedWorkbenchLanding {...props} />
}
