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
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360'
      // dummy gas limit: 0x3d4c52 (4 mil)
      const blockGasLimitHex = '0x3d4c52'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = inputBn.muln(1.5)
      assert(outputBn.eq(expectedBn), 'returns 1.5 the input value')
    })
    
    it('uses original estimatedGas, when above block gas limit', function() {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360'
      // dummy gas limit: 0x0f4240 (1 mil)
      const blockGasLimitHex = '0x0f4240'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = hexToBn(inputHex)
      assert(outputBn.eq(expectedBn), 'returns the original estimatedGas value')
    })

    it('buffers up to reccomend gas limit reccomended ceiling', function() {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360'
      // dummy gas limit: 0x1e8480 (2 mil)
      const blockGasLimitHex = '0x1e8480'
      const blockGasLimitBn = hexToBn(blockGasLimitHex)
      const ceilGasLimitBn = blockGasLimitBn.muln(0.9)
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      // const inputBn = hexToBn(inputHex)
      // const outputBn = hexToBn(output)
      const expectedHex = bnToHex(ceilGasLimitBn)
      assert.equal(output, expectedHex, 'returns the gas limit reccomended ceiling value')
    })
  })
})

// util

function hexToBn(inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}

function bnToHex(inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}