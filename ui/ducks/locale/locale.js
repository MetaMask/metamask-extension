const SET_CURRENT_LOCALE = 'metamask/setCurrentLocale';

export default function reduceLocaleMessages(state = {}, { type, value }) {
  switch (type) {
    case SET_CURRENT_LOCALE:
      return {
        ...state,
        current: value.messages,
      };
    default:
      return state;
  }
}

export const getCurrentLocaleMessages = (state) => state.localeMessages.current;

export const getEnLocaleMessages = (state) => state.localeMessages.en;
