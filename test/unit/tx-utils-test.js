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
    it('multiplies by 1.5, when within block gas limit', function() {
      // naive estimatedGas: 0x123fad (~1.2 mil)
      const input = '0x123fad'
      // dummy gas limit: 0x3d4c52 (4 mil)
      const blockGasLimit = '0x3d4c52'
      const output = txUtils.addGasBuffer(input, blockGasLimit)
      const inputBn = new BN(ethUtil.stripHexPrefix(input), 'hex')
      const outputBn = new BN(ethUtil.stripHexPrefix(output), 'hex')
      const expectedBn = inputBn.muln(1.5)
      assert(outputBn.eq(expectedBn), 'returns 1.5 the input value')
    })
    
    it('uses original estimatedGas, when above block gas limit', function() {
      // naive estimatedGas: 0x123fad (~1.2 mil)
      const input = '0x123fad'
      // dummy gas limit: 0x0f4240 (1 mil)
      const blockGasLimit = '0x0f4240'
      const output = txUtils.addGasBuffer(input, blockGasLimit)
      const inputBn = new BN(ethUtil.stripHexPrefix(input), 'hex')
      const outputBn = new BN(ethUtil.stripHexPrefix(output), 'hex')
      const expectedBn = new BN(ethUtil.stripHexPrefix(input), 'hex')
      assert(outputBn.eq(expectedBn), 'returns the original estimatedGas value')
    })

    it('buffers up to block gas limit', function() {
      // naive estimatedGas: 0x123fad (~1.2 mil)
      const input = '0x1e8480'
      // dummy gas limit: 0x1e8480 (2 mil)
      const blockGasLimit = '0x1e8480'
      const output = txUtils.addGasBuffer(input, blockGasLimit)
      const inputBn = new BN(ethUtil.stripHexPrefix(input), 'hex')
      const outputBn = new BN(ethUtil.stripHexPrefix(output), 'hex')
      const expectedBn = new BN(ethUtil.stripHexPrefix(blockGasLimit), 'hex')
      assert(outputBn.eq(expectedBn), 'returns the block gas limit value')
    })
  })
})
