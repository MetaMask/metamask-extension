const selectors = {
  sendGasIsInError,
}

module.exports = selectors

function sendGasIsInError (state) {
  return state.send.errors.gasLoading
}
