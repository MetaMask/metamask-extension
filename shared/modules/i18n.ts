import log from 'loglevel';
import { Json } from '@metamask/utils';
import getFetchWithTimeout from './fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

// From app/_locales folders there is a messages.json file such as app/_locales/en, comes with key and translated results
// and we use as t('reject') to get the translated message in the codebase
// and in i18n lib, the translated message is an object (I18NMessage) with message & description -
// message is the string that will replace the translationKey, and that message may contain replacement variables such as $1, $2, etc.
// Description is key describing the usage of the message.
export type I18NMessage = {
  message: string;
  description?: string;
};

// The overall translation file is made of same entries
// translationKey (string) and the I18NMessage as the value.
export type I18NMessageDict = {
  [translationKey: string]: I18NMessage;
};

export type I18NSubstitution = string | (() => any) | object;

// A parameterized type (or generic type) of maps that use the same structure (translationKey) key
type I18NMessageDictMap<R> = {
  [translationKey: string]: R;
};

export const FALLBACK_LOCALE = 'en';

const warned: { [localeCode: string]: I18NMessageDictMap<boolean> } = {};

const missingMessageErrors: I18NMessageDictMap<Error> = {};

const missingSubstitutionErrors: {
  [localeCode: string]: I18NMessageDictMap<boolean>;
} = {};

const relativeTimeFormatLocaleData = new Set();

/**
 * Returns a localized message for the given key
 *
 * @param localeCode - The code for the current locale
 * @param localeMessages - The map of messages for the current locale
 * @param key - The message key
 * @param substitutions - A list of message substitution replacements can replace $n in given message
 * @param onError - An optional callback to provide additional processing on any errors
 * @param join - An optional callback to join the substituted parts using custom logic
 * @returns The localized message
 */
export const getMessage = <T>(
  localeCode: string,
  localeMessages: I18NMessageDict,
  key: string,
  substitutions?: I18NSubstitution[],
  onError?: (error: Error) => void,
  join?: (substitutedParts: I18NSubstitution[]) => T,
): T | string | null => {
  if (!localeMessages) {
    return null;
  }

  const message = localeMessages[key];

  if (!message) {
    missingKeyError(key, localeCode, onError);
    return null;
  }

  const text = message.message;

  const parts = hasSubstitutions(substitutions)
    ? applySubstitutions(
        text,
        substitutions as I18NSubstitution[],
        key,
        localeCode,
        onError,
      )
    : [text];

  return join ? join(parts) : parts.join('');
};

export async function fetchLocale(
  localeCode: string,
): Promise<I18NMessageDict> {
  try {
    const response = await fetchWithTimeout(
      `./_locales/${localeCode}/messages.json`,
    );
    return await response.json();
  } catch (error) {
    log.error(`failed to fetch ${localeCode} locale because of ${error}`);
    return {};
  }
}

export async function loadRelativeTimeFormatLocaleData(
  localeCode: string,
): Promise<void> {
  const languageTag = localeCode.split('_')[0];
  if (
    Intl.RelativeTimeFormat &&
    typeof (Intl.RelativeTimeFormat as any).__addLocaleData === 'function' &&
    !relativeTimeFormatLocaleData.has(languageTag)
  ) {
    const localeData = await fetchRelativeTimeFormatData(languageTag);
    (Intl.RelativeTimeFormat as any).__addLocaleData(localeData);
    relativeTimeFormatLocaleData.add(languageTag);
  }
}

export function clearCaches() {
  Object.keys(warned).forEach((key) => {
    delete warned[key];
  });

  Object.keys(missingMessageErrors).forEach((key) => {
    delete missingMessageErrors[key];
  });

  Object.keys(missingSubstitutionErrors).forEach((key) => {
    delete missingSubstitutionErrors[key];
  });

  relativeTimeFormatLocaleData.clear();
}

function applySubstitutions(
  message: string,
  substitutions: I18NSubstitution[],
  key: string,
  localeCode: string,
  onError?: (error: Error) => void,
): I18NSubstitution[] {
  const parts = message.split(/(\$\d)/gu);

  return parts.map((part: string) => {
    const subMatch = part.match(/\$(\d)/u);

    if (!subMatch) {
      return part;
    }

    const substituteIndex = Number(subMatch[1]) - 1;
    const substitution = substitutions[substituteIndex];

    if (substitution === null || substitution === undefined) {
      missingSubstitutionError(key, localeCode, onError);
    }

    return substitutions?.[substituteIndex];
  });
}

function missingKeyError(
  key: string,
  localeCode: string,
  onError?: (error: Error) => void,
) {
  if (localeCode === FALLBACK_LOCALE && !missingMessageErrors[key]) {
    const error = new Error(
      `Unable to find value of key "${key}" for locale "${localeCode}"`,
    );

    missingMessageErrors[key] = error;

    onError?.(error);
    log.error(error);

    if (process.env.IN_TEST) {
      throw error;
    }
  }

  if (localeCode === FALLBACK_LOCALE || warned[localeCode]?.[key]) {
    return;
  }

  warned[localeCode] = warned[localeCode] ?? {};
  warned[localeCode][key] = true;

  log.warn(
    `Translator - Unable to find value of key "${key}" for locale "${localeCode}"`,
  );
}

function missingSubstitutionError(
  key: string,
  localeCode: string,
  onError?: (error: Error) => void,
) {
  if (missingSubstitutionErrors[localeCode]?.[key]) {
    return;
  }

  missingSubstitutionErrors[localeCode] =
    missingSubstitutionErrors[localeCode] ?? {};

  missingSubstitutionErrors[localeCode][key] = true;

  const error = new Error(
    `Insufficient number of substitutions for key "${key}" with locale "${localeCode}"`,
  );

  log.error(error);

  onError?.(error);
}

function hasSubstitutions(substitutions?: I18NSubstitution[]) {
  return (substitutions?.length ?? 0) > 0;
}

async function fetchRelativeTimeFormatData(languageTag: string): Promise<Json> {
  const response = await fetchWithTimeout(
    `./intl/${languageTag}/relative-time-format-data.json`,
  );
  return await response.json();
}
