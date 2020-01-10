import extend from 'xtend'
import { actionConstants } from '../../store/actions'

export default reduceMetamask

function reduceMetamask (state, action) {
  const localeMessagesState = extend({}, state.localeMessages)

  switch (action.type) {
    case actionConstants.SET_CURRENT_LOCALE:
      return extend(localeMessagesState, {
        current: action.value.messages,
      })
    default:
      return localeMessagesState
  }
}
