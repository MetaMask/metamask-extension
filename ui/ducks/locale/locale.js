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
 * This selector returns a code from file://./../../../app/_locales/index.json.
 *
 * NOT SAFE FOR INTL API USE. Use getIntlLocale instead for that.
 *
 * @param state
 * @returns {string} the user's selected locale.
 * These codes are not safe to use with the Intl API.
 */
export const getCurrentLocale = (state) => state.localeMessages.currentLocale;

/**
 * This selector returns a
 * [BCP 47 Language Tag](https://en.wikipedia.org/wiki/IETF_language_tag)
 * for use with the Intl API.
 *
 * @returns {Intl.UnicodeBCP47LocaleIdentifier} the user's selected locale.
 */
export const getIntlLocale = createSelector(
  getCurrentLocale,
  (locale) => Intl.getCanonicalLocales(locale.replace(/_/gu, '-'))[0],
);

export const getCurrentLocaleMessages = (state) => state.localeMessages.current;

export const getEnLocaleMessages = (state) => state.localeMessages.en;
