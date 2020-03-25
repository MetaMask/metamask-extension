import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'

import proxyquire from 'proxyquire'

const tokenData = {
  value1: {
    name: 'transfer',
    params: [
      { name: '_to', value: '0xAddress', type: 'address' },
      { name: '_value', value: '100000000', type: 'uint256' },
    ],
  },
  value2: {
    name: 'transfer',
    params: [
      { name: '_to', value: '0xAddress', type: 'address' },
      { name: '_value', value: '200000000', type: 'uint256' },
    ],
  },
}

const utilsMethosStubs = {
  getTokenData: sinon.stub()
    .withArgs('0xData').returns(tokenData.value1)
    .withArgs('0xNewData').returns(tokenData.value2),
  getTokenValue: sinon.stub().returns('200000000'),
}

const TokenCurrencyDisplay = proxyquire('../token-currency-display.component.js', {
  '../../../helpers/utils/token-util': {
    getTokenValue: utilsMethosStubs.getTokenValue,
  },
  '../../../helpers/utils/transactions.util': {
    getTokenData: utilsMethosStubs.getTokenData,
  },
}).default

describe('Token Currency Display', function () {

  let wrapper

  const props = {
    transactionData: '0xData',
    token: {
      address: '0x419d0d8bdd9af5e606ae2232ed285aff190e711b',
      symbol: 'FUN',
      decimals: 8,
    },
  }

  beforeEach(function () {
    wrapper = shallow(
      <TokenCurrencyDisplay {...props} />
    )
  })

  afterEach(function () {
    utilsMethosStubs.getTokenData.resetHistory()
  })


  after(function () {
    sinon.restore()
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('new data', function () {
    wrapper.setProps({ transactionData: '0xNewData' })
    assert.equal(utilsMethosStubs.getTokenData.getCall(1).returnValue, tokenData.value2)
  })
})
