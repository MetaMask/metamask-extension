import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getTheme } from '../selectors';
import { ThemeType } from '../../shared/constants/preferences';

/**
 * List of valid themes.
 */
const validThemes = Object.values(ThemeType).filter((theme) => {
  return theme !== ThemeType.os;
});

/**
 * Returns the current system theme preference.
 *
 * @returns The system theme (light or dark)
 */
function getSystemTheme(): ThemeType.light | ThemeType.dark {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? ThemeType.dark
    : ThemeType.light;
}

/**
 * Resolves the theme based on the user's theme setting.
 *
 * @param settingTheme - The theme setting from user preferences
 * @param systemTheme - The current system theme
 * @returns The resolved theme (light or dark)
 */
function resolveTheme(
  settingTheme: string | undefined,
  systemTheme: ThemeType.light | ThemeType.dark,
): ThemeType.light | ThemeType.dark {
  const documentTheme = document.documentElement.getAttribute('data-theme');

  let resolvedTheme;
  if (settingTheme === ThemeType.os) {
    resolvedTheme = systemTheme;
  } else if (settingTheme) {
    resolvedTheme = settingTheme;
  } else {
    // Initial load
    resolvedTheme = documentTheme || systemTheme;
  }

  const isValidTheme = validThemes.includes(
    resolvedTheme as ThemeType.light | ThemeType.dark,
  );

  if (!isValidTheme) {
    console.warn(
      `useTheme: Invalid theme resolved to "${resolvedTheme}". Defaulting to "${ThemeType.light}".`,
    );
    return ThemeType.light;
  }

  return resolvedTheme as ThemeType.light | ThemeType.dark;
}

/**
 * Returns the current theme based on the user's theme setting.
 * Listens for system theme changes when the user has selected OS theme.
 *
 * @returns theme
 */
export function useTheme(): ThemeType.light | ThemeType.dark {
  const settingTheme = useSelector(getTheme);
  const [systemTheme, setSystemTheme] = useState<
    ThemeType.light | ThemeType.dark
  >(getSystemTheme);
  const [theme, setTheme] = useState<ThemeType.light | ThemeType.dark>(() =>
    resolveTheme(settingTheme, systemTheme),
  );

  // Handler for system theme changes
  const handleSystemThemeChange = useCallback((event: MediaQueryListEvent) => {
    const newSystemTheme = event.matches ? ThemeType.dark : ThemeType.light;
    setSystemTheme(newSystemTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [handleSystemThemeChange]);

  // Update theme when setting or system theme changes
  useEffect(() => {
    const resolved = resolveTheme(settingTheme, systemTheme);
    setTheme(resolved);
  }, [settingTheme, systemTheme]);

  return theme;
}
