import React from 'react'
import assert from 'assert'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
import sinon from 'sinon'

import TokenCell from '.'
import Identicon from '../../ui/identicon'

describe('Token Cell', function () {
  let wrapper

  const state = {
    metamask: {
      currentCurrency: 'usd',
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

  let onClick

  beforeEach(function () {
    onClick = sinon.stub()
    wrapper = mount(
      <Provider store={store}>
        <TokenCell
          address="0xAnotherToken"
          symbol="TEST"
          string="5.000"
          currentCurrency="usd"
          image="./test-image"
          onClick={onClick}
        />
      </Provider>
    )
  })

  afterEach(function () {
    sinon.restore()
  })

  it('renders Identicon with props from token cell', function () {
    assert.equal(wrapper.find(Identicon).prop('address'), '0xAnotherToken')
    assert.equal(wrapper.find(Identicon).prop('image'), './test-image')
  })

  it('renders token balance and symbol', function () {
    assert.equal(wrapper.find('.list-item__heading').text(), '5.000 TEST ')
  })

  it('renders converted fiat amount', function () {
    assert.equal(wrapper.find('.list-item__subheading').text(), '$0.52 USD')
  })

  it('calls onClick when clicked', function () {
    assert.ok(!onClick.called)
    wrapper.simulate('click')
    assert.ok(onClick.called)
  })
})
