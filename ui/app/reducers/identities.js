const extend = require('xtend')
const actions = require('../actions')

module.exports = reduceIdentities

function reduceIdentities (state, action) {
  // clone + defaults
  var idState = extend({

  }, state.identities)

  switch (action.type) {
    default:
      return idState
  }
}
