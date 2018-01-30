const assert = require('assert')
const TxGasUtils = require('../../app/scripts/lib/tx-gas-utils')
const { createStubedProvider } = require('../stub/provider')

describe('Tx Gas Util', function () {
  let txGasUtil, provider, providerResultStub
  beforeEach(function () {
    providerResultStub = {}
    provider = createStubedProvider(providerResultStub)
    txGasUtil = new TxGasUtils({
      provider,
    })
  })

  it('removes recipient for txParams with 0x when contract data is provided', function () {
    const zeroRecipientandDataTxParams = {
      from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
      to: '0x',
      data: 'bytecode',
    }
    const sanitizedTxParams = txGasUtil.validateRecipient(zeroRecipientandDataTxParams)
    assert.deepEqual(sanitizedTxParams, { from: '0x1678a085c290ebd122dc42cba69373b5953b831d', data: 'bytecode' }, 'no recipient with 0x')
  })

  it('should error when recipient is 0x', function () {
    const zeroRecipientTxParams = {
      from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
      to: '0x',
    }
    assert.throws(() => { txGasUtil.validateRecipient(zeroRecipientTxParams) }, Error, 'Invalid recipient address')
  })
})
