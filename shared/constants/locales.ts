import { FALLBACK_LOCALE } from '#shared/lib/i18n';

/**
 * Locale codes that are actively maintained by the MetaMask team.
 * All other locales in app/_locales/index.json are community-submitted.
 */
export const MAINTAINED_LOCALE_CODES: ReadonlySet<string> = new Set([
  'de',
  'el',
  'en',
  // We are maintaining the Latin America Spanish locale  'es_419',
  'es_419',
  'fr',
  'hi',
  'id',
  'ja',
  'ko',
  'pt',
  'ru',
  'tl',
  'tr',
  'vi',
  'zh_CN',
]);

/**
 * Returns `true` when the locale is actively maintained, `false` otherwise.
 *
 * @param locale - A locale code such as `'fr'` or `'pt_BR'`.
 * @returns `true` when the locale is actively maintained, `false` otherwise.
 */
export function isMaintainedLocale(locale: string | undefined): boolean {
  return Boolean(locale && MAINTAINED_LOCALE_CODES.has(locale));
}

/**
 * Normalizes the locale code to use hyphens ('-') instead of underscores ('_')
 *
 * @param locale - A locale code such as `'fr'` or `'pt_BR'`.
 * @returns The normalized locale in BCP 47 format.
 */
export const getNormalizedLocale = (locale: string | undefined): string =>
  Intl.getCanonicalLocales(
    locale ? locale.replace(/_/gu, '-') : FALLBACK_LOCALE,
  )[0];

/**
 * Device regions added to the formatting locale so the local currency symbol is kept.
 */
export const narrowSymbolExempt: ReadonlySet<string> = new Set([
  'AU',
  'CA',
  'NZ',
  'US',
]);

/**
 * Device regions that use the short currency symbol.
 * Add a region here to roll that symbol out.
 */
export const narrowSymbolRegions: ReadonlySet<string> = new Set();

function regionOf(locale: string) {
  try {
    return new Intl.Locale(locale).region;
  } catch {
    return undefined;
  }
}

function keepsRegion(locale: string, region: string) {
  try {
    const resolved = new Intl.NumberFormat(locale).resolvedOptions().locale;
    return new Intl.Locale(resolved).region === region;
  } catch {
    return false;
  }
}

/**
 * The short currency symbol is off unless the device region is selected in
 * {@link narrowSymbolRegions}.
 *
 * @param region - A device region code.
 * @returns Whether formatting should use `currencyDisplay: 'narrowSymbol'`.
 */
export function usesNarrowUsdSymbol(region: string | undefined): boolean {
  return Boolean(
    region &&
    narrowSymbolRegions.has(region) &&
    !narrowSymbolExempt.has(region),
  );
}

export type FormattingLocale = {
  locale: string;
  narrowUsdSymbol: boolean;
};

/**
 * Builds the locale used for numbers, currency, and dates.
 *
 * The stored language is kept. The device region is added only when that
 * region keeps the local currency symbol and Intl keeps the language-region
 * pair. `narrowUsdSymbol` is true only when the device region is selected for
 * the short symbol.
 *
 * @param appLocale - The stored locale code, such as `'en'`.
 * @param deviceLocale - The device locale. Defaults to the runtime locale.
 * @returns The formatting locale and whether USD uses the short symbol.
 */
export function buildFormattingLocale(
  appLocale: string | undefined,
  deviceLocale?: string,
): FormattingLocale {
  const stored = (appLocale || FALLBACK_LOCALE).replace(/_/gu, '-');
  const deviceRegion = regionOf(
    deviceLocale ?? new Intl.NumberFormat().resolvedOptions().locale,
  );
  const [language] = stored.split('-');
  const attachRegion = Boolean(
    deviceRegion && narrowSymbolExempt.has(deviceRegion),
  );
  const candidate = attachRegion ? `${language}-${deviceRegion}` : stored;
  const locale =
    !attachRegion || !deviceRegion || !keepsRegion(candidate, deviceRegion)
      ? stored
      : candidate;

  return {
    locale,
    narrowUsdSymbol: usesNarrowUsdSymbol(deviceRegion),
  };
}
