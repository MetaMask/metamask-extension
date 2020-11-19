import assert from 'assert'
import proxyquire from 'proxyquire'
import sinon from 'sinon'
import { TOKEN_TRANSFER_FUNCTION_SIGNATURE } from '../../send.constants'

const stubs = {
  rawEncode: sinon.stub().callsFake((arr1, arr2) => {
    return [...arr1, ...arr2]
  }),
}

const sendUtils = proxyquire('../send-footer.utils.js', {
  'ethereumjs-abi': {
    rawEncode: stubs.rawEncode,
  },
})
const { addressIsNew, constructTxParams, constructUpdatedTx } = sendUtils

describe('send-footer utils', function () {
  describe('addressIsNew()', function () {
    it('should return false if the address exists in toAccounts', function () {
      assert.equal(
        addressIsNew(
          [{ address: '0xabc' }, { address: '0xdef' }, { address: '0xghi' }],
          '0xdef',
        ),
        false,
      )
    })

    it('should return true if the address does not exists in toAccounts', function () {
      assert.equal(
        addressIsNew(
          [{ address: '0xabc' }, { address: '0xdef' }, { address: '0xghi' }],
          '0xxyz',
        ),
        true,
      )
    })
  })

  describe('constructTxParams()', function () {
    it('should return a new txParams object with data if there data is given', function () {
      assert.deepEqual(
        constructTxParams({
          data: 'someData',
          sendToken: undefined,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
        {
          data: '0xsomeData',
          to: '0xmockTo',
          value: '0xmockAmount',
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
        },
      )
    })

    it('should return a new txParams object with value and to properties if there is no sendToken', function () {
      assert.deepEqual(
        constructTxParams({
          sendToken: undefined,
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
        {
          data: undefined,
          to: '0xmockTo',
          value: '0xmockAmount',
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
        },
      )
    })

    it('should return a new txParams object without a to property and a 0 value if there is a sendToken', function () {
      assert.deepEqual(
        constructTxParams({
          sendToken: { address: '0x0' },
          to: 'mockTo',
          amount: 'mockAmount',
          from: 'mockFrom',
          gas: 'mockGas',
          gasPrice: 'mockGasPrice',
        }),
        {
          data: undefined,
          value: '0x0',
          from: '0xmockFrom',
          gas: '0xmockGas',
          gasPrice: '0xmockGasPrice',
        },
      )
    })
  })

  describe('constructUpdatedTx()', function () {
    it('should return a new object with an updated txParams', function () {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        sendToken: false,
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

    it('should not have data property if there is non in the original tx', function () {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        sendToken: false,
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

    it('should have token property values if sendToken is truthy', function () {
      const result = constructUpdatedTx({
        amount: 'mockAmount',
        editingTransactionId: '0x456',
        from: 'mockFrom',
        gas: 'mockGas',
        gasPrice: 'mockGasPrice',
        sendToken: {
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
