const assert = require('assert')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

const TxUtils = require('../../app/scripts/lib/tx-utils')


describe('txUtils', function() {
  let txUtils

  before(function() {
    txUtils = new TxUtils()
  })

  describe('addGasBuffer', function() {
    it('multiplies by 1.5', function() {
      const input = '0x123fad'
      const output = txUtils.addGasBuffer(input, '0x3d4c52') //0x3d4c52 is 4mil for dummy gas limit

      const inputBn = new BN(ethUtil.stripHexPrefix(input), 'hex')
      const outputBn = new BN(ethUtil.stripHexPrefix(output), 'hex')
      const expectedBn = inputBn.muln(1.5)
      assert(outputBn.eq(expectedBn), 'returns 1.5 the input value')
    })
  })
})
