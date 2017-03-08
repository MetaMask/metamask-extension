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
      const inputHex = '0x123fad'
      // dummy gas limit: 0x3d4c52 (4 mil)
      const blockGasLimitHex = '0x3d4c52'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = inputBn.muln(1.5)
      assert(outputBn.eq(expectedBn), 'returns 1.5 the input value')
    })
    
    it('uses original estimatedGas, when above block gas limit', function() {
      // naive estimatedGas: 0x123fad (~1.2 mil)
      const inputHex = '0x123fad'
      // dummy gas limit: 0x0f4240 (1 mil)
      const blockGasLimitHex = '0x0f4240'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = hexToBn(inputHex)
      assert(outputBn.eq(expectedBn), 'returns the original estimatedGas value')
    })

    it('buffers up to block gas limit', function() {
      // naive estimatedGas: 0x123fad (~1.2 mil)
      const inputHex = '0x1e8480'
      // dummy gas limit: 0x1e8480 (2 mil)
      const blockGasLimitHex = '0x1e8480'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = hexToBn(blockGasLimitHex)
      assert(outputBn.eq(expectedBn), 'returns the block gas limit value')
    })
  })
})

// util

function hexToBn(inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}