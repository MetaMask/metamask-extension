import assert from 'assert'
import React from 'react'
import render from '../../../../../../test/lib/render-helpers'
import NetworkDropdownIcon from '../components/network-dropdown-icon'

describe('Network Dropdown Icon', function () {

  it('adds style props based on props', function () {
    const props = {
      backgroundColor: 'red',
      isSelected: false,
      innerBorder: 'none',
      diameter: '12',
    }

    const { container } = render(<NetworkDropdownIcon {...props} />)

    const icon = container.querySelector('.menu-icon-circle > div')
    const styleAttributes = icon.style._values

    assert.equal(styleAttributes.background, 'red')
    assert.equal(styleAttributes.height, '12px')
    assert.equal(styleAttributes.width, '12px')
  })
})
