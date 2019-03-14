const selectors = {
  getCurrentBlockTime,
  getBasicGasEstimateLoadingStatus,
}

module.exports = selectors

function getCurrentBlockTime (state) {
  return state.gas.currentBlockTime
}

function getBasicGasEstimateLoadingStatus (state) {
  return state.gas.basicEstimateIsLoading
}
