import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import { DropdownMenuItem } from '../components/dropdown'

describe('Dropdown', function () {
  let wrapper
  const onClickSpy = sinon.spy()
  const closeMenuSpy = sinon.spy()

  beforeEach(function () {
    wrapper = shallow(
      <DropdownMenuItem
        onClick={onClickSpy}
        style={{ test: 'style' }}
        closeMenu={closeMenuSpy}
      />,
    )
  })

  it('renders li with dropdown-menu-item class', function () {
    assert.equal(wrapper.find('li.dropdown-menu-item').length, 1)
  })

  it('adds style based on props passed', function () {
    assert.equal(wrapper.prop('style').test, 'style')
  })

  it('simulates click event and calls onClick and closeMenu', function () {
    wrapper.prop('onClick')()
    assert.equal(onClickSpy.callCount, 1)
    assert.equal(closeMenuSpy.callCount, 1)
  })
})
