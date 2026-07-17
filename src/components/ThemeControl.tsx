import { useSyncExternalStore } from 'react'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  readThemePreference,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from '../theme'

const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark']

function getThemePreferenceSnapshot(): ThemePreference {
  return readThemePreference(window.localStorage)
}

function isThemePreference(value: string | undefined): value is ThemePreference {
  return value !== undefined && THEME_OPTIONS.includes(value as ThemePreference)
}

export function ThemeControl() {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreferenceSnapshot,
    () => 'system'
  )

  return (
    <ToggleGroup
      aria-label="Appearance"
      value={[preference]}
      onValueChange={values => {
        const nextPreference = values[0]
        if (isThemePreference(nextPreference)) {
          setThemePreference(nextPreference)
        }
      }}
      variant="outline"
      size="appearance"
      spacing={0}
    >
      <ToggleGroupItem value="system">System</ToggleGroupItem>
      <ToggleGroupItem value="light">Light</ToggleGroupItem>
      <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
    </ToggleGroup>
  )
}
