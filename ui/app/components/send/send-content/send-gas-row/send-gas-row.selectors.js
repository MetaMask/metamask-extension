const selectors = {
  gasFeeIsInError,
  getGasLoadingError,
}

module.exports = selectors

function getGasLoadingError (state) {
  return state.send.errors.gasLoading
}

function gasFeeIsInError (state) {
  return Boolean(state.send.errors.gasFee)
}
