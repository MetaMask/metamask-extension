import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
const { TOKEN_TRANSFER_FUNCTION_SIGNATURE } = require('../../send.constants')

const stubs = {
  rawEncode: sinon.stub().callsFake((arr1, arr2) => {
    return [ ...arr1, ...arr2 ]
  }),
}

const sendUtils = proxyquire('../send-footer.utils.js', {
  'ethereumjs-abi': {
    rawEncode: stubs.rawEncode,
  },
})
const {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
  addHexPrefixToObjectValues,
} = sendUtils

describe('send-footer utils', () => {

  describe('addHexPrefixToObjectValues()', () => {
    it('should return a new object with the same properties with a 0x prefix', () => {
      assert.deepEqual(
        addHexPrefixToObjectValues({
          prop1: '0x123',
          prop2: '456',
          prop3: 'x',
        }),
        {
          prop1: '0x123',
          prop2: '0x456',
          prop3: '0xx',
        }
      )
    })
  })

  describe('addressIsNew()', () => {
    it('should return false if the address exists in toAccounts', () => {
      assert.equal(
        addressIsNew([
          { address: '0xabc' },
          { address: '0xdef' },
          { address: '0xghi' },
        ], '0xdef'),
        false
      )
    })

    it('should return true if the address does not exists in toAccounts', () => {
      assert.equal(
        addressIsNew([
          { address: '0xabc' },
          { address: '0xdef' },
          { address: '0xghi' },
        ], '0xxyz'),
        true
      )
    })
  })

  describe('constructTxParams()', () => {
    it('should return a new txParams object with value and to properties if there is no selectedToken', () => {
      assert.deepEqual(
        constructTxParams({
          selectedToken: false,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
        {
          to: '0xmockTo',
          value: '0xmockAmount',
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
        }
      )
    })

    it('should return a new txParams object without a to property and a 0 value if there is a selectedToken', () => {
      assert.deepEqual(
        constructTxParams({
          selectedToken: true,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
        {
          value: '0x0',
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
        }
      )
    })
  })

  describe('constructUpdatedTx()', () => {
    it('should return a new object with an updated txParams', () => {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        selectedToken: false,
        to: 'mockTo',
        unapprovedTxs: {
          '0x123': {},
          '0x456': {
            unapprovedTxParam: 'someOtherParam',
            txParams: {
              data: 'someData',
            },
          },
        },
      })

      assert.deepEqual(result, {
        unapprovedTxParam: 'someOtherParam',
        txParams: {
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
          value: '0xmockAmount',
          to: '0xmockTo',
          data: '0xsomeData',
        },
      })
    })

    it('should not have data property if there is non in the original tx', () => {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        selectedToken: false,
        to: 'mockTo',
        unapprovedTxs: {
          '0x123': {},
          '0x456': {
            unapprovedTxParam: 'someOtherParam',
            txParams: {
              from: 'oldFrom',
              gas: 'oldGas',
              gasPrice: 'oldGasPrice',
            },
          },
        },
      })

      assert.deepEqual(result, {
        unapprovedTxParam: 'someOtherParam',
        txParams: {
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
          value: '0xmockAmount',
          to: '0xmockTo',
        },
      })
    })

    it('should have token property values if selectedToken is truthy', () => {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        selectedToken: {
          address: 'mockTokenAddress',
        },
        to: 'mockTo',
        unapprovedTxs: {
          '0x123': {},
          '0x456': {
            unapprovedTxParam: 'someOtherParam',
            txParams: {},
          },
        },
      })

      assert.deepEqual(result, {
        unapprovedTxParam: 'someOtherParam',
        txParams: {
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
          value: '0x0',
          to: '0xmockTokenAddress',
          data: `${TOKEN_TRANSFER_FUNCTION_SIGNATURE}ss56Tont`,
        },
      })
    })
  })

})
