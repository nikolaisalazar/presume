import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  initializeTheme,
  readThemePreference,
  resolveTheme,
  setThemePreference,
} from '../theme'

function installColorSchemePreference(initiallyDark: boolean) {
  let dark = initiallyDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQuery = {
    get matches() {
      return dark
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_type, listener) => {
      listeners.add(listener as (event: MediaQueryListEvent) => void)
    }),
    removeEventListener: vi.fn((_type, listener) => {
      listeners.delete(listener as (event: MediaQueryListEvent) => void)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } satisfies MediaQueryList

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))

  return {
    mediaQuery,
    change(nextDark: boolean) {
      dark = nextDark
      const event = { matches: nextDark, media: mediaQuery.media } as MediaQueryListEvent
      listeners.forEach(listener => listener(event))
    },
  }
}

function installMemoryStorage() {
  const values = new Map<string, string>()
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  }
  vi.stubGlobal('localStorage', storage)
  return storage
}

describe('theme preference', () => {
  afterEach(() => {
    document.documentElement.className = ''
    delete document.documentElement.dataset.theme
    document.documentElement.style.colorScheme = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('treats missing and invalid stored values as system', () => {
    const storage = {
      getItem: vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('sepia')
        .mockReturnValueOnce('dark'),
    }

    expect(readThemePreference(storage)).toBe('system')
    expect(readThemePreference(storage)).toBe('system')
    expect(readThemePreference(storage)).toBe('dark')
    expect(readThemePreference({ getItem: () => { throw new Error('blocked') } }))
      .toBe('system')
  })

  it('resolves explicit choices directly and system from the media query', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('system', true)).toBe('dark')
  })

  it('applies the resolved theme to the root element', () => {
    const root = document.documentElement

    applyResolvedTheme(root, 'dark')
    expect(root).toHaveClass('dark')
    expect(root).toHaveAttribute('data-theme', 'dark')
    expect(root.style.colorScheme).toBe('dark')

    applyResolvedTheme(root, 'light')
    expect(root).not.toHaveClass('dark')
    expect(root).toHaveAttribute('data-theme', 'light')
    expect(root.style.colorScheme).toBe('light')
  })

  it('follows system changes until an explicit persisted choice is made', () => {
    const colorScheme = installColorSchemePreference(false)
    const storage = installMemoryStorage()

    expect(initializeTheme()).toBe('system')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(colorScheme.mediaQuery.addEventListener).toHaveBeenCalledOnce()

    colorScheme.change(true)
    expect(document.documentElement.dataset.theme).toBe('dark')

    setThemePreference('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light')
    expect(storage.setItem).not.toHaveBeenCalledWith('presume:resume', expect.anything())
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(colorScheme.mediaQuery.removeEventListener).toHaveBeenCalled()

    colorScheme.change(true)
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
