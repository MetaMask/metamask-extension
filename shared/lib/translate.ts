// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import enTranslations from '../../app/_locales/en/messages.json';
import {
  FALLBACK_LOCALE,
  I18NMessageDict,
  fetchLocale,
  getMessage,
} from '../modules/i18n';

let currentLocale: string = FALLBACK_LOCALE;
let translations: I18NMessageDict = enTranslations;

export async function updateCurrentLocale(locale: string): Promise<void> {
  if (currentLocale === locale) {
    return;
  }

  if (locale === FALLBACK_LOCALE) {
    translations = enTranslations;
  } else {
    translations = await fetchLocale(locale);
  }

  currentLocale = locale;
}

export function t(key: string, ...substitutions: string[]): string | null {
  return (
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    getMessage(currentLocale, translations, key, substitutions) ||
    getMessage(FALLBACK_LOCALE, enTranslations, key, substitutions)
  );
}
