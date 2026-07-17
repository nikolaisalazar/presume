export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'presume:theme'

const THEME_CHANGE_EVENT = 'presume:theme-change'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

let activeMediaQuery: MediaQueryList | null = null
let activeMediaListener: ((event: MediaQueryListEvent) => void) | null = null

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function readThemePreference(
  storage: Pick<Storage, 'getItem'>
): ThemePreference {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

export function applyResolvedTheme(
  root: HTMLElement,
  theme: ResolvedTheme
): void {
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

function detachSystemPreferenceListener() {
  if (activeMediaQuery && activeMediaListener) {
    activeMediaQuery.removeEventListener('change', activeMediaListener)
  }
  activeMediaQuery = null
  activeMediaListener = null
}

function getColorSchemeMediaQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_MEDIA_QUERY)
    : null
}

function notifyThemeChange() {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

function applyThemePreference(preference: ThemePreference) {
  detachSystemPreferenceListener()
  const mediaQuery = getColorSchemeMediaQuery()
  applyResolvedTheme(
    document.documentElement,
    resolveTheme(preference, mediaQuery?.matches ?? false)
  )

  if (preference !== 'system' || !mediaQuery) return

  const listener = (event: MediaQueryListEvent) => {
    applyResolvedTheme(
      document.documentElement,
      resolveTheme('system', event.matches)
    )
    notifyThemeChange()
  }
  mediaQuery.addEventListener('change', listener)
  activeMediaQuery = mediaQuery
  activeMediaListener = listener
}

export function initializeTheme(): ThemePreference {
  const preference = readThemePreference(window.localStorage)
  applyThemePreference(preference)
  return preference
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // The appearance still applies for this session when storage is unavailable.
  }
  applyThemePreference(preference)
  notifyThemeChange()
}

export function subscribeToTheme(listener: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, listener)
  return () => window.removeEventListener(THEME_CHANGE_EVENT, listener)
}
