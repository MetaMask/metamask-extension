const selectors = {
  getMaxModeOn,
  sendAmountIsInError,
}

module.exports = selectors

function getMaxModeOn (state) {
  return state.metamask.send.maxModeOn
}

function sendAmountIsInError (state) {
    return Boolean(state.metamask.send.errors.amount)
}
