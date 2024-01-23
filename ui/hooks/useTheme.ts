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

  const [theme, setTheme] = useState(() => {
    const result =
      !settingTheme || settingTheme === ThemeType.os
        ? document.documentElement.getAttribute('data-theme')
        : settingTheme;
    const isValidTheme = validThemes.includes(result as ThemeType);

    if (!isValidTheme) {
      console.warn(
        `useTheme: Invalid theme resolved to "${result}". Defaulting to "${ThemeType.light}".`,
      );
      return ThemeType.light;
    }

    return result;
  });

  useEffect(() => {
    if (settingTheme) {
      setTheme(settingTheme);
    }
  }, [settingTheme]);

  return theme;
}
