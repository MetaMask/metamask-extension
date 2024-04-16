import { createSelector } from 'reselect';
import * as actionConstants from '../../store/actionConstants';

export default function reduceLocaleMessages(state = {}, { type, payload }) {
  switch (type) {
    case actionConstants.SET_CURRENT_LOCALE:
      return {
        ...state,
        current: payload.messages,
        currentLocale: payload.locale,
      };
    default:
      return state;
  }
}

/**
 * @param state
 * @returns {string} one of the codes in file://./../../../app/_locales/index.json.
 * These codes are not safe to use with the Intl API.
 */
export const getLocaleNotSafeForIntl = (state) =>
  state.localeMessages.currentLocale;

/**
 * This selector returns a code from /app/_locales/index.json as a
 * [BCP 47 Language Tag](https://en.wikipedia.org/wiki/IETF_language_tag) for use with
 * the Intl API.
 *
 * @returns {Intl.UnicodeBCP47LocaleIdentifier} a locale code that can be used with the Intl API
 */
export const getIntlLocale = createSelector(
  getLocaleNotSafeForIntl,
  (locale) => Intl.getCanonicalLocales(locale.replace(/_/gu, '-'))[0],
);

export const getCurrentLocaleMessages = (state) => state.localeMessages.current;

export const getEnLocaleMessages = (state) => state.localeMessages.en;
