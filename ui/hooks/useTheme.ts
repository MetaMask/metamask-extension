import { useEffect, useState } from 'react';
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
 * Resolves the theme based on the user's theme setting.
 *
 * @param settingTheme - The theme setting from user preferences
 * @returns The resolved theme (light or dark)
 */
function resolveTheme(settingTheme: string | undefined): string {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? ThemeType.dark
    : ThemeType.light;

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

  return resolvedTheme;
}

/**
 * Returns the current theme based on the user's theme setting.
 *
 * @returns theme
 */
export function useTheme() {
  const settingTheme = useSelector(getTheme);
  const [theme, setTheme] = useState(() => resolveTheme(settingTheme));

  useEffect(() => {
    const resolved = resolveTheme(settingTheme);
    setTheme(resolved);
  }, [settingTheme]);

  return theme;
}
