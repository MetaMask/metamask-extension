import assert from 'assert'
import {
  unconfirmedTransactionsCountSelector,
  sendTokenTokenAmountAndToAddressSelector,
  contractExchangeRateSelector,
  conversionRateSelector,
} from '../confirm-transaction'

const getEthersArrayLikeFromObj = (obj) => {
  const arr = []
  Object.keys(obj).forEach((key) => {
    arr.push([obj[key]])
    arr[key] = obj[key]
  })
  return arr
}

describe('Confirm Transaction Selector', function () {
  describe('unconfirmedTransactionsCountSelector', function () {
    const state = {
      metamask: {
        unapprovedTxs: {
          1: {
            metamaskNetworkId: 'test',
          },
          2: {
            metmaskNetworkId: 'other network',
          },
        },
        unapprovedMsgCount: 1,
        unapprovedPersonalMsgCount: 1,
        unapprovedTypedMessagesCount: 1,
        network: 'test',
      },
    }

    it('returns number of txs in unapprovedTxs state with the same network plus unapproved signing method counts', function () {
      assert.equal(unconfirmedTransactionsCountSelector(state), 4)
    })
  })

  describe('sendTokenTokenAmountAndToAddressSelector', function () {
    const state = {
      confirmTransaction: {
        tokenData: {
          name: 'transfer',
          args: getEthersArrayLikeFromObj({
            _to: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            _value: { toString: () => '1' },
          }),
        },
        tokenProps: {
          tokenDecimals: '2',
          tokenSymbol: 'META',
        },
      },
    }

    it('returns token address and calculated token amount', function () {
      assert.deepEqual(sendTokenTokenAmountAndToAddressSelector(state), {
        toAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        tokenAmount: '0.01',
      })
    })
  })

  describe('contractExchangeRateSelector', function () {
    const state = {
      metamask: {
        contractExchangeRates: {
          '0xTokenAddress': '10',
        },
      },
      confirmTransaction: {
        txData: {
          txParams: {
            to: '0xTokenAddress',
          },
        },
      },
    }

    it('returns contract exchange rate in metamask state based on confirm transaction txParams token recipient', function () {
      assert.equal(contractExchangeRateSelector(state), 10)
    })
  })

  describe('conversionRateSelector', function () {
    it('returns conversionRate from state', function () {
      const state = {
        metamask: { conversionRate: 556.12 },
      }
      assert.equal(conversionRateSelector(state), 556.12)
    })
  })
})
