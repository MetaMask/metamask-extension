import React from 'react'
import assert from 'assert'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import sinon from 'sinon'
import { mountWithStore } from '../../../lib/render-helpers'
import { Dropdown } from '../../../../ui/app/components/app/dropdowns/components/dropdown'

const mockState = {
  metamask: {
  },
}

describe('Dropdown components', function () {
  let onClickOutside
  let onClick

  const createMockStore = configureMockStore([thunk])

  const dropdownComponentProps = {
    isOpen: true,
    zIndex: 11,
    onClickOutside,
    style: {
      position: 'absolute',
      right: 0,
      top: '36px',
    },
    innerStyle: {},
  }

  let dropdownComponent
  let store
  let component
  beforeEach(function () {
    onClickOutside = sinon.spy()
    onClick = sinon.spy()

    store = createMockStore(mockState)
    component = mountWithStore((
      <Dropdown {...dropdownComponentProps}>
        <style>
          {
            `
              .drop-menu-item:hover { background:rgb(235, 235, 235); }
              .drop-menu-item i { margin: 11px; }
            `
          }
        </style>
        <li onClick={onClick}>Item 1</li>
        <li onClick={onClick}>Item 2</li>
      </Dropdown>
    ), store)
    dropdownComponent = component
  })

  it('can render two items', function () {
    const items = dropdownComponent.find('li')
    assert.equal(items.length, 2)
  })

  it('invokes click handler when item clicked', function () {
    const items = dropdownComponent.find('li')
    const node = items.at(0)
    node.simulate('click')
    assert.ok(onClick.calledOnce)
  })
})
