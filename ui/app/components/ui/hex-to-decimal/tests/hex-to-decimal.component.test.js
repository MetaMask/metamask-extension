import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import HexToDecimal from '../hex-to-decimal.component'

describe('HexToDecimal Component', function () {
  it('should render a prefixed hex as a decimal with a className', function () {
    const wrapper = shallow(
      <HexToDecimal value="0x3039" className="hex-to-decimal" />,
    )

    assert.ok(wrapper.hasClass('hex-to-decimal'))
    assert.equal(wrapper.text(), '12345')
  })

  it('should render an unprefixed hex as a decimal with a className', function () {
    const wrapper = shallow(
      <HexToDecimal value="1A85" className="hex-to-decimal" />,
    )

    assert.ok(wrapper.hasClass('hex-to-decimal'))
    assert.equal(wrapper.text(), '6789')
  })
})
