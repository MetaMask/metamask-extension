import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { fireEvent } from '@testing-library/react'
import render from '../../../../../../test/lib/render-helpers'
import { DropdownMenuItem } from '../components/dropdown'

describe('Dropdown', function () {
  let utils

  const props = {
    onClick: sinon.spy(),
    closeMenu: sinon.spy(),
  }

  beforeEach(function () {
    utils = render(<DropdownMenuItem {...props} />)
  })

  after(function () {
    sinon.restore()
  })

  it('renders li with dropdown-menu-item class', function () {
    const list = utils.getByRole('listitem')
    assert(list)
  })

  it('simulates click event and calls onClick and closeMenu', function () {
    const dropdownMenuItem = utils.container.querySelector('.dropdown-menu-item')
    fireEvent.click(dropdownMenuItem)

    assert(props.onClick.calledOnce)
    assert(props.closeMenu.calledOnce)
  })

})
