import { actionConstants } from '../../store/actions'

export default function reduceLocaleMessages (state = {}, { type, value }) {
  switch (type) {
    case actionConstants.SET_CURRENT_LOCALE:
      return {
        ...state,
        current: value.messages,
      }
    default:
      return state
  }
}
