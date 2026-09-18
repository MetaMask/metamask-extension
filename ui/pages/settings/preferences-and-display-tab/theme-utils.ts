import { ThemeType } from '../../../../shared/constants/preferences';

// Theme types with their corresponding translation keys.
export const THEME_OPTIONS: {
  value: ThemeType;
  labelKey: string;
}[] = [
  { value: ThemeType.light, labelKey: 'lightTheme' },
  { value: ThemeType.dark, labelKey: 'darkTheme' },
  { value: ThemeType.os, labelKey: 'osTheme' },
];

// Map of theme types to their translation keys.
export const THEME_LABEL_MAP: Record<ThemeType, string> = Object.fromEntries(
  THEME_OPTIONS.map(({ value, labelKey }) => [value, labelKey]),
) as Record<ThemeType, string>;
