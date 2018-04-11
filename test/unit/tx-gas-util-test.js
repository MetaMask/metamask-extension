const assert = require('assert')
const TxGasUtils = require('../../app/scripts/lib/tx-gas-utils')
const { createTestProviderTools } = require('../stub/provider')

describe('Tx Gas Util', function () {
  let txGasUtil, provider, providerResultStub
  beforeEach(function () {
    providerResultStub = {}
    provider = createTestProviderTools({ scaffold: providerResultStub }).provider
    txGasUtil = new TxGasUtils({
      provider,
    })
  })
})
