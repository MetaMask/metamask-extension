import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import NetworkDropdownIcon from '../components/network-dropdown-icon'

describe('Network Dropdown Icon', function () {
  it('adds style props based on props', function () {
    const wrapper = shallow(
      <NetworkDropdownIcon
        backgroundColor="red"
        isSelected={false}
        innerBorder="none"
        diameter="12"
      />,
    )
    const styleProp = wrapper.find('.menu-icon-circle').children().prop('style')
    assert.strictEqual(styleProp.background, 'red')
    assert.strictEqual(styleProp.border, 'none')
    assert.strictEqual(styleProp.height, '12px')
    assert.strictEqual(styleProp.width, '12px')
  })
})
