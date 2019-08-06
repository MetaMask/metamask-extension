const selectors = {
  getToDropdownOpen,
  getTokens,
  sendToIsInError,
  sendToIsInWarning,
}

module.exports = selectors

function getToDropdownOpen (state) {
  return state.send.toDropdownOpen
}

function sendToIsInError (state) {
  return Boolean(state.send.errors.to)
}

function sendToIsInWarning (state) {
  return Boolean(state.send.warnings.to)
}

function getTokens (state) {
  return state.metamask.tokens
}
