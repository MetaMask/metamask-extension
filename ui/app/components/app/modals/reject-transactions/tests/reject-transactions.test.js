import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
// import { mount } from 'enzyme'
import { screen, fireEvent } from '@testing-library/react'
import configureMockStore from 'redux-mock-store'
import render from '../../../../../../../test/lib/render-helpers'
import RejectTransactionsModal from '..'

describe('Reject Transactions Model', function () {
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
    unapprovedTxCount: 2,
  }

  afterEach(function () {
    props.hideModal.resetHistory()
  })

  it('hides modal when cancel button is clicked', function () {
    const store = configureMockStore()(mockState)
    render(<RejectTransactionsModal {...props} />, store)

    const cancelButton = screen.getByText(/cancel/u)
    fireEvent.click(cancelButton)

    assert.equal(store.getActions()[0].type, 'UI_MODAL_CLOSE')
  })

  it('onSubmit is called when reject all clicked', function () {
    const store = configureMockStore()(mockState)
    render(<RejectTransactionsModal {...props} />, store)

    const rejectAllButton = screen.getByText(/rejectAll/u)
    fireEvent.click(rejectAllButton)

    assert(props.onSubmit.calledOnce)
  })

})
