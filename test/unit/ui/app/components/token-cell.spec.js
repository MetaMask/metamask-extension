import React from 'react'
import assert from 'assert'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'

import TokenCell from '../../../../../ui/app/components/app/token-cell'
import Identicon from '../../../../../ui/app/components/ui/identicon'

describe('Token Cell', function () {
  let wrapper

  const state = {
    metamask: {
      network: 'test',
      currentCurrency: 'usd',
      selectedTokenAddress: '0xToken',
      selectedAddress: '0xAddress',
      contractExchangeRates: {
        '0xAnotherToken': 0.015,
      },
      conversionRate: 7.00,
    },
    appState: {
      sidebar: {
        isOpen: true,
      },
    },
  }

  const middlewares = [thunk]
  const mockStore = configureMockStore(middlewares)
  const store = mockStore(state)

  beforeEach(function () {
    wrapper = mount(
      <Provider store={store}>
        <TokenCell
          address="0xAnotherToken"
          symbol="TEST"
          string="5.000"
          network={22}
          currentCurrency="usd"
          image="./test-image"
        />
      </Provider>
    )
  })

  it('renders Identicon with props from token cell', function () {
    assert.equal(wrapper.find(Identicon).prop('address'), '0xAnotherToken')
    assert.equal(wrapper.find(Identicon).prop('network'), 'test')
    assert.equal(wrapper.find(Identicon).prop('image'), './test-image')
  })

  it('renders token balance', function () {
    assert.equal(wrapper.find('.token-list-item__token-balance').text(), '5.000')
  })

  it('renders token symbol', function () {
    assert.equal(wrapper.find('.token-list-item__token-symbol').text(), 'TEST')
  })

  it('renders converted fiat amount', function () {
    assert.equal(wrapper.find('.token-list-item__fiat-amount').text(), '0.52 USD')
  })

})
