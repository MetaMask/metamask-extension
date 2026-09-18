import { FALLBACK_LOCALE } from '../lib/i18n';

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
