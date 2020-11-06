import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import * as reactRedux from 'react-redux'
import CurrencyDisplay from '../currency-display.component'

describe('CurrencyDisplay Component', function () {
  beforeEach(function () {
    const stub = sinon.stub(reactRedux, 'useSelector')
    stub.callsFake(() => ({
      currentCurrency: 'usd',
      nativeCurrency: 'ETH',
      conversionRate: 280.45,
    }))
  })
  it('should render text with a className', function () {
    const wrapper = shallow(
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
        hideLabel
      />,
    )

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '$123.45')
  })

  it('should render text with a prefix', function () {
    const wrapper = shallow(
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
        prefix="-"
        hideLabel
      />,
    )

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '-$123.45')
  })
  afterEach(function () {
    sinon.restore()
  })
})
