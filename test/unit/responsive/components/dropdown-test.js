import assert from 'assert'
import React from 'react'
import configureMockStore from 'redux-mock-store'
import { fireEvent } from '@testing-library/react'
import sinon from 'sinon'
import { renderWithProvider } from '../../../lib/render-helpers'
import { Dropdown } from '../../../../ui/app/components/app/dropdowns/components/dropdown'

describe('Dropdown components', function () {
  const mockState = {
    metamask: {},
  }

  const props = {
    isOpen: true,
    zIndex: 11,
    onClickOutside: sinon.spy(),
    style: {
      position: 'absolute',
      right: 0,
      top: '36px',
    },
    innerStyle: {},
  }

  it('invokes click handler when item clicked', function () {
    const store = configureMockStore()(mockState)

    const onClickSpy = sinon.spy()

    const { getByText } = renderWithProvider(
      <Dropdown {...props}>
        <li onClick={onClickSpy}>Item 1</li>
        <li onClick={onClickSpy}>Item 2</li>
      </Dropdown>,
      store,
    )

    const item1 = getByText(/Item 1/u)
    fireEvent.click(item1)

    assert.ok(onClickSpy.calledOnce)
  })
})
