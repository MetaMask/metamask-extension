const selectors = {
  getCurrentBlockTime,
  getBasicGasEstimateLoadingStatus,
}

export default selectors

function getCurrentBlockTime (state) {
  return state.gas.currentBlockTime
}

function getBasicGasEstimateLoadingStatus (state) {
  return state.gas.basicEstimateIsLoading
}
