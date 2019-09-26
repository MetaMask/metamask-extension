import React from 'react'
import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import ConfirmSendToken from '../index'

describe('Confirm Send Token', () => {
  let wrapper

  const mockStore = {
    metamask: {
      addressBook: {},
      featureFlags: {
        'advancedInlineGas': true,
      },
      selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      network: '66',
      cachedBalances: {
        '66': {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': '0xde0b6b3a7640000',
        },
      },
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          balance: '0xde0b6b3a7640000',
        },
      },
      identities: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          name: 'Account 1',
        },
      },
      selectedTokenAddress: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      contractExchangeRates: {
        '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4': 0,
      },
      currentCurrency: 'usd',
      conversionRate: 100,
      preferences: {},
      provider: {
        type: 'test',
      },
      unapprovedTxs: {
        1: {
          id: 1,
          status: 'unapproved',
          metamaskNetworkId: '66',
          txParams: {
            from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            to: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
            value: '0x0',
            data: '0xa9059cbb000000000000000000000000eddbb091d94d4a11084a4306bb945f509fd51db40000000000000000000000000000000000000000000000000de0b6b3a7640000',
            gas: '0xd8b1',
            gasPrice: '0x2540be400',
          },
        },
      },
      selectedAddressTxList: [
        {
          id: 1,
          status: 'unapproved',
          metamaskNetworkId: '66',
          txParams: {
            from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            to: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
            value: '0x0',
            data: '0xa9059cbb000000000000000000000000f74176bd80708bab197a0b5063c57440fd9fea59000000000000000000000000000000000000000000000000016345785d8a0000',
            gas: '0xdaf1',
            gasPrice: '0x77359400',
          },
        },
      ],
      assetImages: {
        '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4': null,
      },
    },

    confirmTransaction: {
      fiatTransactionTotal: '0.12',
      methodData: {},
      txData: {
        id: 1,
        metamaskNetworkId: '66',
        status: 'unapproved',
        txParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          to: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
          value: '0x0',
          data: '0xa9059cbb000000000000000000000000eddbb091d94d4a11084a4306bb945f509fd51db40000000000000000000000000000000000000000000000000de0b6b3a7640000',
          gas: '0xd8b1',
          gasPrice: '0x2540be400',
        },
      },
      tokenData: {
        name: 'transfer',
        params: [
          {
            name: '_to',
            value: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            type: 'address',
          },
          {
            name: '_value',
            value: '1000000000000000000',
            type: 'uint256',
          },
        ],
      },
    },
    gas: {},
  }

  const store = configureMockStore()(mockStore)

  beforeEach(() => {
    wrapper = mountWithRouter(
      <ConfirmSendToken />, store
    )
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })
})
