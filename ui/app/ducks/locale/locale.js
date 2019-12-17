const extend = require('xtend')
const actions = require('../../store/actions')

module.exports = reduceMetamask

function reduceMetamask (state, action) {
  const localeMessagesState = extend({}, state.localeMessages)

  switch (action.type) {
    case actions.SET_CURRENT_LOCALE:
      return extend(localeMessagesState, {
        current: action.value.messages,
      })
    default:
      return localeMessagesState
  }
}
