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
 * Device regions where the local "$" is kept, so USD does not use narrowSymbol.
 */
export const narrowSymbolExempt: ReadonlySet<string> = new Set([
  'AU',
  'CA',
  'NZ',
  'US',
]);

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
 * USD uses narrowSymbol unless the device region is in
 * {@link narrowSymbolExempt}.
 *
 * @param region - A device region code.
 * @returns Whether USD should use `currencyDisplay: 'narrowSymbol'`.
 */
export function usesNarrowUsdSymbol(region: string | undefined): boolean {
  return !region || !narrowSymbolExempt.has(region);
}

/**
 * Builds the locale used for numbers, currency, and dates.
 *
 * The stored language is kept. The device region is added only when USD does
 * not use narrowSymbol for that region and Intl keeps the language-region pair.
 *
 * @param appLocale - The stored locale code, such as `'en'`.
 * @param deviceLocale - The device locale. Defaults to the runtime locale.
 * @returns A BCP 47 locale for number and date formatting.
 */
export function buildFormattingLocale(
  appLocale: string | undefined,
  deviceLocale?: string,
) {
  const stored = (appLocale || FALLBACK_LOCALE).replace(/_/gu, '-');
  const deviceRegion = regionOf(
    deviceLocale ?? new Intl.NumberFormat().resolvedOptions().locale,
  );
  if (!deviceRegion || usesNarrowUsdSymbol(deviceRegion)) {
    return stored;
  }

  const [language] = stored.split('-');
  const candidate = `${language}-${deviceRegion}`;
  return keepsRegion(candidate, deviceRegion) ? candidate : stored;
}
