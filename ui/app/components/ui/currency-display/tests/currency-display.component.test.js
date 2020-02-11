import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import CurrencyDisplay from '../currency-display.component'

describe('CurrencyDisplay Component', function () {
  it('should render text with a className', function () {
    const wrapper = shallow((
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
      />
    ))

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '$123.45')
  })

  it('should render text with a prefix', function () {
    const wrapper = shallow((
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
        prefix="-"
      />
    ))

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '-$123.45')
  })
})
