import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import { fireEvent } from '@testing-library/react'
import * as actions from '../../../../../store/actions'
import render from '../../../../../../../test/lib/render-helpers'
import ConfirmRemoveAccount from '..'

describe('Confirm Remove Account', function () {
  const addressToRemove = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'

  const state = {
    metamask: {
      network: '101',
    },
    appState: {
      modal: {
        modalState: {
          name: 'CONFIRM_REMOVE_ACCOUNT',
          props: {
            identity: {
              name: 'Account 2',
              address: addressToRemove,
            },
          },
        },
      },
    },
  }

  const props = {
    hideModal: sinon.spy(),
    removeAccount: sinon.stub().resolves(),
  }

  const store = configureStore([thunk])(state)

  afterEach(function () {
    props.hideModal.resetHistory()
  })

  it('nevermind', function () {
    const { getByText } = render(
      <ConfirmRemoveAccount {...props} />, store,
    )

    const nevermindButton = getByText(/nevermind/u)
    fireEvent.click(nevermindButton)

    assert.equal(store.getActions()[0].type, 'UI_MODAL_CLOSE')
  })

  it('remove', function () {
    const removeAccountSpy = sinon.stub(actions, 'removeAccount').returns(() => Promise.resolve())

    const { getByText } = render(
      <ConfirmRemoveAccount {...props} />, store,
    )

    const removeButton = getByText('[remove]')
    fireEvent.click(removeButton)

    assert.equal(removeAccountSpy.getCall(0).args[0], addressToRemove)
  })

})
