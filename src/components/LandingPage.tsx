import { StandardLanding } from '@/components/landing/StandardLanding'
import { TechnicalFolioLanding } from '@/components/landing/TechnicalFolioLanding'
import { getIterationTwoConcept } from '@/components/landing/landingIterationTwoContent'

export interface LandingPageProps {
  hasSavedResume: boolean
  onOpenEditor: () => void
}

export function LandingPage(props: LandingPageProps) {
  const concept = getIterationTwoConcept(window.location.search)

  if (concept === 'folio') return <TechnicalFolioLanding {...props} />
  return <StandardLanding {...props} />
}
