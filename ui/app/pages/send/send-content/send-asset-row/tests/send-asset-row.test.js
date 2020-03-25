import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../../test/lib/render-helpers'
import SendAssetRow from '../index'

describe('SendAssetRow', function () {

  let wrapper

  const mockState = {
    metamask: {
      conversionRate: 280.45,
      currentCurrency: 'usd',
      nativeCurrency: 'ETH',
      selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      network: '66',
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          balance: '0xde0b6b3a7640000',
        },
      },
      cachedBalances: {
        '66': {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': '0xde0b6b3a7640000',
        },
      },
      tokens: [
        {
          address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
          symbol: 'META',
          decimals: 18,
        },
      ],
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      provider: {
        type: 'rpc',
      },
    },
  }

  const store = configureStore()(mockState)

  const props = {
    setSelectedToken: sinon.stub(),
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <Provider store={store}>
        <SendAssetRow {...props} />
      </Provider>
    )
  })

  after(function () {
    sinon.restore()
  })

  it('sets dropdown in state', function () {
    const dropdown = wrapper.find('.send-v2__asset-dropdown__input-wrapper')

    dropdown.simulate('click')

    assert.equal(wrapper.find('SendAssetRow').state('isShowingDropdown'), true)
  })

  it('sets asset from dropdown menu', function () {

    const dropdown = wrapper.find('.send-v2__asset-dropdown__input-wrapper')
    dropdown.simulate('click')

    const selectToken = wrapper.find('.send-v2__asset-dropdown__asset').last()
    selectToken.simulate('click')

    assert.deepEqual(
      store.getActions(),
      [{ type: 'SET_SELECTED_TOKEN', value: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4' }]
    )
  })
})

