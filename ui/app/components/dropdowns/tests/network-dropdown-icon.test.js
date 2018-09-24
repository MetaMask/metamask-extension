import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import NetworkDropdownIcon from '../components/network-dropdown-icon'

describe('Network Dropdown Icon', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<NetworkDropdownIcon
      backgroundColor = {'red'}
      isSelected = {false}
      innerBorder = {'none'}
      diameter = {'12'}
    />)
  })

  it('adds style props based on props', () => {
    const styleProp = wrapper.find('.menu-icon-circle').children().prop('style')
    assert.equal(styleProp.background, 'red')
    assert.equal(styleProp.border, 'none')
    assert.equal(styleProp.height, '12px')
    assert.equal(styleProp.width, '12px')
  })
})
