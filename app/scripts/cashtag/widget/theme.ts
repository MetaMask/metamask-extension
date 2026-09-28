export type CashtagTheme = 'light' | 'dark';

export const CASHTAG_WIDGET_UPDATES = {
  Theme: 'cashtag.theme',
} as const;

export function isCashtagTheme(value: unknown): value is CashtagTheme {
  return value === 'light' || value === 'dark';
}

export function isCashtagThemeUpdate(
  value: unknown,
): value is { type: typeof CASHTAG_WIDGET_UPDATES.Theme; theme: CashtagTheme } {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const update = value as Record<string, unknown>;
  return (
    update.type === CASHTAG_WIDGET_UPDATES.Theme && isCashtagTheme(update.theme)
  );
}
