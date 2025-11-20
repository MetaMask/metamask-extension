import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getTheme } from '../selectors';
import { ThemeType } from '../../shared/constants/preferences';

/**
 * List of valid themes. Should return an array with only the values ThemeType.light and ThemeType.dark
 * unless there is a future we add more themes.
 */
const validThemes = Object.values(ThemeType).filter((theme) => {
  return theme !== ThemeType.os;
});

/**
 * Returns the current theme based on the user's theme setting.
 *
 * @returns theme
 */
export function useTheme() {
  const settingTheme = useSelector(getTheme);
  const [theme, setTheme] = useState(settingTheme);

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? ThemeType.dark
      : ThemeType.light;

    const documentTheme = document.documentElement.getAttribute('data-theme');

    let resolvedTheme;
    if (settingTheme === ThemeType.os) {
      // When OS theme is selected, use system preference
      resolvedTheme = systemTheme;
    } else if (settingTheme) {
      // When a specific theme is selected (light/dark)
      resolvedTheme = settingTheme;
    } else {
      // Initial load: check document theme or fall back to system theme
      resolvedTheme = documentTheme || systemTheme;
    }

    const isValidTheme = validThemes.includes(
      resolvedTheme as ThemeType.light | ThemeType.dark,
    );

    if (!isValidTheme) {
      console.warn(
        `useTheme: Invalid theme resolved to "${resolvedTheme}". Defaulting to "${ThemeType.light}".`,
      );
      setTheme(ThemeType.light);
      return;
    }

    setTheme(resolvedTheme);
  }, [settingTheme]);

  return theme;
}
