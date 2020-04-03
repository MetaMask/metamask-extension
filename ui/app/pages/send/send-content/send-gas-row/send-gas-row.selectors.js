export function getGasLoadingError (state) {
  return state.send.errors.gasLoading
}

export function gasAndCollateralFeeIsInError (state) {
  return Boolean(state.send.errors.gasAndCollateralFee)
}

export function getGasButtonGroupShown (state) {
  return state.send.gasButtonGroupShown
}
