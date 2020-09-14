import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { screen, fireEvent } from '@testing-library/react'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from '../../../../../store/actions'
import render from '../../../../../../../test/lib/render-helpers'
import ConfirmResetAccount from '..'

describe('Confirm Reset Account', function () {

  const mockState = {
    metamask: {},
    appState: {
      modal: {
        modalState: {
          name: 'CONFIRM_RESET_ACCOUNT',
          props: {},
        },
      },
    },
  }

  it('render', function () {
    const store = configureMockStore()(mockState)
    render(<ConfirmResetAccount />, store)

    const nevermindButton = screen.getByText(/nevermind/u)
    fireEvent.click(nevermindButton)

    assert.equal(store.getActions()[0].type, 'UI_MODAL_CLOSE')
  })

  it('removes', function () {
    const store = configureMockStore([thunk])(mockState)

    const resetAccountSpy = sinon.stub(actions, 'resetAccount').returns(() => Promise.resolve())
    render(<ConfirmResetAccount />, store)

    const resetButton = screen.getByText('[reset]')
    fireEvent.click(resetButton)

    assert(resetAccountSpy.calledOnce)
  })

})
