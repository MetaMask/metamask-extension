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

  it('should error when from is not a hex string', function () {

    // where from is undefined
    const txParams = {}
    assert.throws(() => { txGasUtil.validateFrom(txParams) }, Error, `Invalid from address ${txParams.from} not a string`)

    // where from is array
    txParams.from = []
    assert.throws(() => { txGasUtil.validateFrom(txParams) }, Error, `Invalid from address ${txParams.from} not a string`)

    // where from is a object
    txParams.from = {}
    assert.throws(() => { txGasUtil.validateFrom(txParams) }, Error, `Invalid from address ${txParams.from} not a string`)

    // where from is a invalid address
    txParams.from = 'im going to fail'
    assert.throws(() => { txGasUtil.validateFrom(txParams) }, Error, `Invalid from address`)

    // should run
    txParams.from ='0x1678a085c290ebd122dc42cba69373b5953b831d'
    txGasUtil.validateFrom(txParams)
    })

})
