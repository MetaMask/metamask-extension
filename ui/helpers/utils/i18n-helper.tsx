// cross-browser connection to extension i18n API
import React from 'react';
import log from 'loglevel';
import { Json } from '@metamask/utils';
import * as Sentry from '@sentry/browser';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

// From app/_locales folders there is a messages.json file such as app/_locales/en, comes with key and translated results
// and we use as t('reject') to get the translated message in the codebase
// and in i18n lib, the translated message is an object (I18NMessage) with message & description -
// message is the string that will replace the translationKey, and that message may contain replacement variables such as $1, $2, etc.
// Description is key describing the usage of the message.
interface I18NMessage {
  message: string;
  description?: string;
}

// The overall translation file is made of same entries
// translationKey (string) and the I18NMessage as the value.
interface I18NMessageDict {
  [translationKey: string]: I18NMessage;
}

// A parameterized type (or generic type) of maps that use the same structure (translationKey) key
interface I18NMessageDictMap<R> {
  [translationKey: string]: R;
}

const warned: { [localeCode: string]: I18NMessageDictMap<boolean> } = {};
const missingMessageErrors: I18NMessageDictMap<Error> = {};
const missingSubstitutionErrors: {
  [localeCode: string]: I18NMessageDictMap<boolean>;
} = {};

function getHasSubstitutions(
  substitutions?: string[],
): substitutions is string[] {
  return (substitutions?.length ?? 0) > 0;
}

/**
 * Returns a localized message for the given key
 *
 * @param localeCode - The code for the current locale
 * @param localeMessages - The map of messages for the current locale
 * @param key - The message key
 * @param substitutions - A list of message substitution replacements can replace $n in given message
 * @returns The localized message
 */
export const getMessage = (
  localeCode: string,
  localeMessages: I18NMessageDict,
  key: string,
  substitutions?: string[],
): JSX.Element | string | null => {
  if (!localeMessages) {
    return null;
  }
  if (!localeMessages[key]) {
    if (localeCode === 'en') {
      if (!missingMessageErrors[key]) {
        missingMessageErrors[key] = new Error(
          `Unable to find value of key "${key}" for locale "${localeCode}"`,
        );
        Sentry.captureException(missingMessageErrors[key]);
        log.error(missingMessageErrors[key]);
        if (process.env.IN_TEST) {
          throw missingMessageErrors[key];
        }
      }
    } else if (!warned[localeCode] || !warned[localeCode][key]) {
      if (!warned[localeCode]) {
        warned[localeCode] = {};
      }
      warned[localeCode][key] = true;
      log.warn(
        `Translator - Unable to find value of key "${key}" for locale "${localeCode}"`,
      );
    }
    return null;
  }

  const hasSubstitutions = getHasSubstitutions(substitutions);
  const hasReactSubstitutions =
    hasSubstitutions &&
    substitutions?.some(
      (element) =>
        element !== null &&
        (typeof element === 'function' || typeof element === 'object'),
    );
  const entry = localeMessages[key];
  const phrase = entry.message;
  // perform substitutions
  if (hasSubstitutions) {
    const parts = phrase.split(/(\$\d)/gu);

    const substitutedParts = parts.map((part: string) => {
      const subMatch = part.match(/\$(\d)/u);
      if (!subMatch) {
        return part;
      }
      const substituteIndex = Number(subMatch[1]) - 1;
      if (
        (substitutions[substituteIndex] === null ||
          substitutions[substituteIndex] === undefined) &&
        !missingSubstitutionErrors[localeCode]?.[key]
      ) {
        if (!missingSubstitutionErrors[localeCode]) {
          missingSubstitutionErrors[localeCode] = {};
        }
        missingSubstitutionErrors[localeCode][key] = true;
        const error = new Error(
          `Insufficient number of substitutions for key "${key}" with locale "${localeCode}"`,
        );
        log.error(error);
        Sentry.captureException(error);
      }
      return substitutions?.[substituteIndex];
    });

    return hasReactSubstitutions ? (
      <span> {substitutedParts} </span>
    ) : (
      substitutedParts.join('')
    );
  }
  return phrase;
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

const relativeTimeFormatLocaleData = new Set();

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
  }
}

async function fetchRelativeTimeFormatData(languageTag: string): Promise<Json> {
  const response = await fetchWithTimeout(
    `./intl/${languageTag}/relative-time-format-data.json`,
  );
  return await response.json();
}
