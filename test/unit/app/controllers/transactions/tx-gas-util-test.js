import { strict as assert } from 'assert'
import Transaction from 'ethereumjs-tx'
import { hexToBn, bnToHex } from '../../../../../app/scripts/lib/util'
import TxUtils from '../../../../../app/scripts/controllers/transactions/tx-gas-utils'

describe('txUtils', function () {
  let txUtils

  before(function () {
    txUtils = new TxUtils(
      new Proxy(
        {},
        {
          get: () => {
            return () => undefined
          },
        },
      ),
    )
  })

  describe('chain Id', function () {
    it('prepares a transaction with the provided chainId', function () {
      const txParams = {
        to: '0x70ad465e0bab6504002ad58c744ed89c7da38524',
        from: '0x69ad465e0bab6504002ad58c744ed89c7da38525',
        value: '0x0',
        gas: '0x7b0c',
        gasPrice: '0x199c82cc00',
        data: '0x',
        nonce: '0x3',
        chainId: 42,
      }
      const ethTx = new Transaction(txParams)
      assert.equal(ethTx.getChainId(), 42, 'chainId is set from tx params')
    })
  })

  describe('addGasBuffer', function () {
    it('multiplies by 1.5, when within block gas limit', function () {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360'
      // dummy gas limit: 0x3d4c52 (4 mil)
      const blockGasLimitHex = '0x3d4c52'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = inputBn.muln(1.5)
      assert.ok(outputBn.eq(expectedBn), 'returns 1.5 the input value')
    })

    it('uses original estimatedGas, when above block gas limit', function () {
      // naive estimatedGas: 0x16e360 (1.5 mil)
      const inputHex = '0x16e360'
      // dummy gas limit: 0x0f4240 (1 mil)
      const blockGasLimitHex = '0x0f4240'
      const output = txUtils.addGasBuffer(inputHex, blockGasLimitHex)
      // const inputBn = hexToBn(inputHex)
      const outputBn = hexToBn(output)
      const expectedBn = hexToBn(inputHex)
      assert.ok(
        outputBn.eq(expectedBn),
        'returns the original estimatedGas value',
      )
    })

    it('buffers up to recommend gas limit recommended ceiling', function () {
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
      assert.equal(
        output,
        expectedHex,
        'returns the gas limit recommended ceiling value',
      )
    })
  })
})
