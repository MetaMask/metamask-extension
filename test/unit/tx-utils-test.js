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
    describe('adds a flat value', function() {
      it('over an empty value', function() {
        const input = '0x0'
        const output = txUtils.addGasBuffer(input)
        assert.notEqual(output, input, 'changed the value')

        const inputBn = new BN(input, 'hex')
        const outputBn = new BN(output, 'hex')
        assert(outputBn.gt(inputBn), 'returns a greater value')
      })

      it('over an value', function() {
        const input = '0x123fad'
        const output = txUtils.addGasBuffer(input)
        assert.notEqual(output, input, 'changed the value')

        const inputBn = new BN(input, 'hex')
        const outputBn = new BN(output, 'hex')
        assert(outputBn.gt(inputBn), 'returns a greater value')
      })
    })
  })
})