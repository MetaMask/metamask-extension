import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import { DropdownMenuItem } from '../components/dropdown.js'

describe('Dropdown', () => {
  let wrapper
  const onClickSpy = sinon.spy()
  const closeMenuSpy = sinon.spy()

  beforeEach(() => {
    wrapper = shallow(
      <DropdownMenuItem
        onClick = {onClickSpy}
        style = {{test: 'style'}}
        closeMenu = {closeMenuSpy}
      >
      </DropdownMenuItem>
    )
  })

  it('renders li with dropdown-menu-item class', () => {
    assert.equal(wrapper.find('li.dropdown-menu-item').length, 1)
  })

  it('adds style based on props passed', () => {
    assert.equal(wrapper.prop('style').test, 'style')
  })

  it('simulates click event and calls onClick and closeMenu', () => {
    wrapper.prop('onClick')()
    assert.equal(onClickSpy.callCount, 1)
    assert.equal(closeMenuSpy.callCount, 1)
  })

})
