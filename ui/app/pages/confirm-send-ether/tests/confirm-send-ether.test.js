import React from 'react'
import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import ConfirmSendEther from '../index'

describe('Confirm Send Ether', () => {
  let wrapper

  const mockStore = {
    metamask: {
      addressBook: {},
      featureFlags: {
        'advancedInlineGas': false,
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
            to: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            value: '0xde0b6b3a7640000',
            gas: '0x5208',
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
            to: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            value: '0xde0b6b3a7640000',
            gas: '0x5208',
            gasPrice: '0x2540be400',
          },
        },
      ],
      assetImages: {},
    },
    confirmTransaction: {
      txData: {
        id: 1,
        metamaskNetworkId: '66',
        status: 'unapproved',
        txParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          to: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          value: '0xde0b6b3a7640000',
          gas: '0x5208',
          gasPrice: '0x2540be400',
        },
      },
      methodData: {},
    },
    gas: {},
  }

  const store = configureMockStore()(mockStore)

  beforeEach(() => {
    wrapper = mountWithRouter(
      <ConfirmSendEther />, store
    )
  })

  it('', () => {
    assert.equal(wrapper.length, 1)
  })
})
