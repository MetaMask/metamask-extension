import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import CurrencyDisplay from '../currency-display.component'

describe('CurrencyDisplay Component', () => {
  it('should render text with a className', () => {
    const wrapper = shallow(<CurrencyDisplay
      displayValue="$123.45"
      className="currency-display"
    />)

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '$123.45')
  })

  it('should render text with a prefix', () => {
    const wrapper = shallow(<CurrencyDisplay
      displayValue="$123.45"
      className="currency-display"
      prefix="-"
    />)

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '-$123.45')
  })
})
