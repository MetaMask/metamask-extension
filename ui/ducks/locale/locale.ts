import { Action } from 'redux'; // Import types for actions
import * as actionConstants from '../../store/actionConstants';
import {
  FALLBACK_LOCALE,
  type I18NMessageDict,
} from '../../../shared/modules/i18n';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';

/**
 * Type for the locale messages part of the state
 */
type LocaleMessagesState = {
  current?: I18NMessageDict; // Messages for the current locale
  currentLocale?: string; // User's selected locale (unsafe for Intl API)
  en?: I18NMessageDict; // English locale messages
};

/**
 * Payload for the SET_CURRENT_LOCALE action
 */
type SetCurrentLocaleAction = Action & {
  type: typeof actionConstants.SET_CURRENT_LOCALE;
  payload: {
    messages: I18NMessageDict;
    locale: string;
    fallbackMessages?: I18NMessageDict;
  };
};

/**
 * Type for actions that can be handled by reduceLocaleMessages
 */
type LocaleMessagesActions = SetCurrentLocaleAction;

/**
 * Initial state for localeMessages reducer
 */
const initialState: LocaleMessagesState = {};

/**
 * Reducer for localeMessages
 *
 * @param state - The current state
 * @param action - The action being dispatched
 * @returns The updated locale messages state
 */
export default function reduceLocaleMessages(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: LocaleMessagesState = initialState,
  action: LocaleMessagesActions,
): LocaleMessagesState {
  switch (action.type) {
    case actionConstants.SET_CURRENT_LOCALE: {
      const { locale, messages, fallbackMessages } = action.payload;
      const nextState: LocaleMessagesState = {
        ...state,
        current: messages,
        currentLocale: locale,
      };

      if (fallbackMessages) {
        nextState.en = fallbackMessages;
      } else if (locale === FALLBACK_LOCALE) {
        nextState.en = messages;
      }

      return nextState;
    }
    default:
      return state;
  }
}

/**
 * Type for the overall Redux state
 */
type AppState = {
  localeMessages: LocaleMessagesState;
};

/**
 * This selector returns a code from file://./../../../app/_locales/index.json.
 * NOT SAFE FOR INTL API USE. Use getIntlLocale instead for that.
 *
 * @param state - The overall state
 * @returns The user's selected locale
 */
export const getCurrentLocale = (state: AppState): string | undefined =>
  state.localeMessages?.currentLocale;

/**
 * This selector returns a BCP 47 Language Tag for use with the Intl API.
 *
 * @returns The user's selected locale in BCP 47 format
 */
export const getIntlLocale = createDeepEqualSelector(
  getCurrentLocale,
  (locale): string =>
    Intl.getCanonicalLocales(
      locale ? locale.replace(/_/gu, '-') : FALLBACK_LOCALE,
    )[0],
);

/**
 * This selector returns the current locale messages.
 *
 * @param state - The overall state
 * @returns The current locale's messages
 */
export const getCurrentLocaleMessages = (
  state: AppState,
): I18NMessageDict | undefined => state.localeMessages.current;

/**
 * This selector returns the English locale messages.
 *
 * @param state - The overall state
 * @returns The English locale's messages
 */
export const getEnLocaleMessages = (
  state: AppState,
): I18NMessageDict | undefined => state.localeMessages.en;
