const selectors = {
  getToDropdownOpen,
  getTokens,
  sendToIsInError,
}

module.exports = selectors

function getToDropdownOpen (state) {
  return state.send.toDropdownOpen
}

function sendToIsInError (state) {
  return Boolean(state.send.errors.to)
}

function getTokens (state) {
  return state.metamask.tokens
}
