const clone = require('clone')

const version = 30

module.exports = {
  version,

  migrate: function (originalData) {
    const versionedData = clone(originalData)
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      if (state.CurrencyController) {
        state.CurrencyRateController = { ...state.CurrencyController }
        delete state.CurrencyController
      }
    } catch (err) {
      console.warn(`MetaMask Migration #${version}` + err.stack)
    }
    return Promise.resolve(versionedData)
  },
}
