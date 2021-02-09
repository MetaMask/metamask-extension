import * as actionConstants from '../../store/actionConstants';

export default function reduceLocaleMessages(state = {}, { type, value }) {
  switch (type) {
    case actionConstants.SET_CURRENT_LOCALE:
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
