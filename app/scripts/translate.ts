import enTranslations from '../_locales/en/messages.json';
import type {
  I18NMessageDict} from '../../shared/modules/i18n';
import {
  FALLBACK_LOCALE,
  fetchLocale,
  getMessage,
} from '../../shared/modules/i18n';

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
    getMessage(currentLocale, translations, key, substitutions) ||
    getMessage(FALLBACK_LOCALE, enTranslations, key, substitutions)
  );
}
