export function getGasLoadingError (state) {
  return state.send.errors.gasLoading
}

export function gasFeeIsInError (state) {
  return Boolean(state.send.errors.gasFee)
}

export function getGasButtonGroupShown (state) {
  return state.send.gasButtonGroupShown
}
