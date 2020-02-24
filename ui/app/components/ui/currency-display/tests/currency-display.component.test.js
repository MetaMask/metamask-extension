import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import CurrencyDisplay from '../currency-display.component'

<<<<<<< HEAD
describe('CurrencyDisplay Component', () => {
  it('should render text with a className', () => {
    const wrapper = shallow(<CurrencyDisplay
      displayValue="$123.45"
      className="currency-display"
    />)
=======
describe('CurrencyDisplay Component', function () {
  it('should render text with a className', function () {
    const wrapper = shallow((
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
      />
    ))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '$123.45')
  })

<<<<<<< HEAD
  it('should render text with a prefix', () => {
    const wrapper = shallow(<CurrencyDisplay
      displayValue="$123.45"
      className="currency-display"
      prefix="-"
    />)
=======
  it('should render text with a prefix', function () {
    const wrapper = shallow((
      <CurrencyDisplay
        displayValue="$123.45"
        className="currency-display"
        prefix="-"
      />
    ))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

    assert.ok(wrapper.hasClass('currency-display'))
    assert.equal(wrapper.text(), '-$123.45')
  })
})
