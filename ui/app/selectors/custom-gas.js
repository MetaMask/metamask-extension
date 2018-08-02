const selectors = {
  getCustomGasPrice,
  getCustomGasLimit,
  getCustomGasErrors,
}

module.exports = selectors

function getCustomGasPrice (state) {
  return state.customGas.price
}

function getCustomGasLimit (state) {
  return state.customGas.limit
}

function getCustomGasErrors (state) {
  return state.customGas.errors
}
