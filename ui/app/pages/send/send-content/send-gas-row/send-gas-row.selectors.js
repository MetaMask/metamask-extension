const selectors = {
  gasFeeIsInError,
  getGasLoadingError,
  getGasButtonGroupShown,
}

module.exports = selectors

function getGasLoadingError (state) {
  return state.send.errors.gasLoading
}

function gasFeeIsInError (state) {
  return Boolean(state.send.errors.gasFee)
}

function getGasButtonGroupShown (state) {
  return state.send.gasButtonGroupShown
}
