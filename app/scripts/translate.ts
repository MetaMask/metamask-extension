import log from 'loglevel';
import enTranslations from '../_locales/en/messages.json';

export interface Translation {
  message: string;
  description?: string;
}

export type TranslationDictionary = {
  [translationKey: string]: Translation;
};

const DEFAULT_LOCALE = 'en';

let currentLocale: string = DEFAULT_LOCALE;
let translations: TranslationDictionary = enTranslations;

export async function updateCurrentLocale(locale: string): Promise<void> {
  if (currentLocale === locale) {
    return;
  }

  // eslint-disable-next-line
  const translationsResponse = await fetch(
    `./_locales/${locale}/messages.json`,
  );

  translations = await translationsResponse.json();
  currentLocale = locale;
}

export function t(key: string, substitutions?: string[]): string | undefined {
  const { message, locale } = getMessage(key);

  if (!message || !locale) {
    return undefined;
  }

  const finalMessage = substitutions?.length
    ? applySubstitutions(message, substitutions, key, locale)
    : message;

  return finalMessage;
}

function getMessage(key: string): { message?: string; locale?: string } {
  const message = translations[key]?.message;

  if (message) {
    return { message, locale: currentLocale };
  }

  if (currentLocale !== DEFAULT_LOCALE) {
    log.warn('Unable to find translation', { key, locale: currentLocale });

    const fallbackMessage = (enTranslations as TranslationDictionary)[key]
      ?.message;

    if (fallbackMessage) {
      return { message: fallbackMessage, locale: DEFAULT_LOCALE };
    }
  }

  log.error('Unable to find translation', { key, locale: DEFAULT_LOCALE });

  if (process.env.IN_TEST) {
    throw new Error(`Unable to find translation for key: ${key}`);
  }

  return {};
}

function applySubstitutions(
  message: string,
  substitutions: string[],
  key: string,
  locale: string,
) {
  const parts = message.split(/(\$\d)/gu);

  const updatedParts = parts.map((part: string) => {
    const tokenMatch = part.match(/\$(\d)/u);

    if (!tokenMatch) {
      return part;
    }

    const index = Number(tokenMatch[1]) - 1;
    const value = substitutions[index];

    if (!value) {
      throw new Error(
        `Insufficient number of substitutions for key "${key}" with locale "${locale}"`,
      );
    }

    return value;
  });

  return updatedParts.join('');
}
