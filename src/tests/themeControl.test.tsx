import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeControl } from '../components/ThemeControl'
import {
  THEME_STORAGE_KEY,
  initializeTheme,
} from '../theme'

function installColorSchemePreference(initiallyDark = false) {
  const mediaQuery = {
    matches: initiallyDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } satisfies MediaQueryList

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))
}

function installMemoryStorage() {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  })
}

describe('ThemeControl', () => {
  afterEach(() => {
    cleanup()
    document.documentElement.className = ''
    delete document.documentElement.dataset.theme
    document.documentElement.style.colorScheme = ''
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('exposes one named option set and persists the selected appearance', async () => {
    installColorSchemePreference()
    installMemoryStorage()
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    initializeTheme()

    render(<ThemeControl />)

    const group = screen.getByRole('group', { name: 'Appearance' })
    const dark = within(group).getByRole('button', { name: 'Dark' })
    const light = within(group).getByRole('button', { name: 'Light' })

    expect(dark).toHaveAttribute('aria-pressed', 'true')

    act(() => dark.focus())
    fireEvent.keyDown(dark, { key: 'ArrowLeft' })
    await waitFor(() => expect(light).toHaveFocus())

    fireEvent.click(light)

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(light).toHaveAttribute('aria-pressed', 'true')
  })
})
