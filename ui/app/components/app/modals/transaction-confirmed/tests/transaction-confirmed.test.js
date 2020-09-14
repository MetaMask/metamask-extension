import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { screen, fireEvent } from '@testing-library/react'
import configureMockStore from 'redux-mock-store'
import render from '../../../../../../../test/lib/render-helpers'
import TransactionConfirmed from '..'

describe('Transaction Confirmed', function () {
  it('clicks ok to submit and hide modal', function () {

    const mockState = {
      metamask: {},
      appState: {
        modal: {
          modalState: {},
        },
      },
    }

    const props = {
      onSubmit: sinon.spy(),
      hideModal: sinon.spy(),
    }

    const store = configureMockStore()(mockState)
    render(<TransactionConfirmed {...props} />, store)

    const okButton = screen.getByText(/ok/u)
    fireEvent.click(okButton)

    assert(props.onSubmit.calledOnce)
  })
})
