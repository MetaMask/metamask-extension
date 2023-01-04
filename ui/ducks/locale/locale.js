import * as actionConstants from '../../store/actionConstants';

export default function reduceLocaleMessages(state = {}, { type, value }) {
  switch (type) {
    case actionConstants.SET_CURRENT_LOCALE:
      return {
        ...state,
        current: value.messages,
        currentLocale: value.locale,
      };
    default:
      return state;
  }
}

export const getCurrentLocale = (state) => state.localeMessages.currentLocale;

export const getCurrentLocaleMessages = (state) => state.localeMessages.current;

export const getEnLocaleMessages = (state) => state.localeMessages.en;
