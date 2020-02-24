import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import NetworkDropdownIcon from '../components/network-dropdown-icon'

<<<<<<< HEAD
describe('Network Dropdown Icon', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<NetworkDropdownIcon
      backgroundColor="red"
      isSelected={false}
      innerBorder="none"
      diameter="12"
    />)
  })

  it('adds style props based on props', () => {
=======
describe('Network Dropdown Icon', function () {
  it('adds style props based on props', function () {
    const wrapper = shallow((
      <NetworkDropdownIcon
        backgroundColor="red"
        isSelected={false}
        innerBorder="none"
        diameter="12"
      />
    ))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    const styleProp = wrapper.find('.menu-icon-circle').children().prop('style')
    assert.equal(styleProp.background, 'red')
    assert.equal(styleProp.border, 'none')
    assert.equal(styleProp.height, '12px')
    assert.equal(styleProp.width, '12px')
  })
})
