import { ThemeControl } from './ThemeControl'
import { BrandMark } from './BrandMark'

export interface AppHeaderProps {
  onOpenLanding: () => void
}

export function AppHeader({ onOpenLanding }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a
        className="app-header__brand app-header__brand-link"
        href="/presume/"
        aria-label="Presume home"
        onClick={event => {
          event.preventDefault()
          onOpenLanding()
        }}
      >
        <BrandMark />
        <h1>Presume</h1>
      </a>
      <div className="app-header__meta" aria-label="Editor status and appearance">
        <span className="app-header__save-status" data-slot="editor-save-status">
          Saved locally
        </span>
        <ThemeControl />
      </div>
    </header>
  )
}
