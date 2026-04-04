/**
 * Locale codes that are actively maintained by the MetaMask team.
 * All other locales in app/_locales/index.json are community-submitted.
 */
export const MAINTAINED_LOCALE_CODES: ReadonlySet<string> = new Set([
  'de',
  'el',
  'en',
  'es',
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
