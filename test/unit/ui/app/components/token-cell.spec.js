import React from 'react'
import PropTypes from 'prop-types'
import assert from 'assert'
import thunk from 'redux-thunk'
import sinon from 'sinon'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'

import TokenCell from '../../../../../ui/app/components/app/token-cell'
import Identicon from '../../../../../ui/app/components/ui/identicon'

const mountOptions = {
  context: {
    metricsEvent: sinon.spy(),
  },
  childContextTypes: {
    metricsEvent: PropTypes.func.isRequired,
  },
}

describe('Token Cell', () => {
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

  beforeEach(() => {
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

  it('renders Identicon with props from token cell', () => {
    assert.equal(wrapper.find(Identicon).prop('address'), '0xAnotherToken')
    assert.equal(wrapper.find(Identicon).prop('network'), 'test')
    assert.equal(wrapper.find(Identicon).prop('image'), './test-image')
  })

  it('renders token balance', () => {
    assert.equal(wrapper.find('.token-list-item__token-balance').text(), '5.000')
  })

  it('renders token symbol', () => {
    assert.equal(wrapper.find('.token-list-item__token-symbol').text(), 'TEST')
  })

  it('renders converted fiat amount', () => {
    assert.equal(wrapper.find('.token-list-item__fiat-amount').text(), '0.52 USD')
  })

  describe('custom tokens as from a plugin', () => {
    it('supports custom detail action', () => {
      wrapper = mount(
        <Provider store={store}>
          <TokenCell
            address="0xAnotherToken"
            symbol="TEST"
            string="5.000"
            currentCurrency="usd"
            image="./test-image"
            onClick={registerClick}
          />
        </Provider>,
        mountOptions
      )

      wrapper.simulate('click')

      function registerClick () {
        assert.ok('click received.')
      }
    })
  })
})
