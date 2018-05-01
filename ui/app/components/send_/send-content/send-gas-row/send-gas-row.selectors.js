const selectors = {
  sendGasIsInError,
}

module.exports = selectors

function sendGasIsInError (state) {
  return state.metamask.send.errors.gasLoading
}
