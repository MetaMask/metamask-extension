import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import HexToDecimal from '../hex-to-decimal.component'

<<<<<<< HEAD
describe('HexToDecimal Component', () => {
  it('should render a prefixed hex as a decimal with a className', () => {
    const wrapper = shallow(<HexToDecimal
      value="0x3039"
      className="hex-to-decimal"
    />)
=======
describe('HexToDecimal Component', function () {
  it('should render a prefixed hex as a decimal with a className', function () {
    const wrapper = shallow((
      <HexToDecimal
        value="0x3039"
        className="hex-to-decimal"
      />
    ))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

    assert.ok(wrapper.hasClass('hex-to-decimal'))
    assert.equal(wrapper.text(), '12345')
  })

<<<<<<< HEAD
  it('should render an unprefixed hex as a decimal with a className', () => {
    const wrapper = shallow(<HexToDecimal
      value="1A85"
      className="hex-to-decimal"
    />)
=======
  it('should render an unprefixed hex as a decimal with a className', function () {
    const wrapper = shallow((
      <HexToDecimal
        value="1A85"
        className="hex-to-decimal"
      />
    ))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

    assert.ok(wrapper.hasClass('hex-to-decimal'))
    assert.equal(wrapper.text(), '6789')
  })
})
