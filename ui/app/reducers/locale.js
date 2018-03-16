const extend = require('xtend')
const actions = require('../actions')
const MetamascaraPlatform = require('../../../app/scripts/platforms/window')
const environmentType = require('../../../app/scripts/lib/environment-type')
const { OLD_UI_NETWORK_TYPE } = require('../../../app/scripts/config').enums

module.exports = reduceMetamask

function reduceMetamask (state, action) {
  const localeMessagesState = extend({}, state.localeMessages)

  switch (action.type) {
    case actions.SET_LOCALE_MESSAGES:
      return action.value
    default:
      return localeMessagesState
  }
}
