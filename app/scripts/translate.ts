import type { I18NMessageDict } from '../../shared/modules/i18n';
import {
  FALLBACK_LOCALE,
  fetchLocale,
  getMessage,
} from '../../shared/modules/i18n';
import enTranslations from '../_locales/en/messages.json';

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

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
export function t(key: string, ...substitutions: string[]): string | null {
  return (
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
    getMessage(currentLocale, translations, key, substitutions) ||
    getMessage(FALLBACK_LOCALE, enTranslations, key, substitutions)
  );
}
