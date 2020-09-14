import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import { fireEvent } from '@testing-library/react'
import render from '../../../../../../../test/lib/render-helpers'
import * as actions from '../../../../../store/actions'
import ConfirmDeleteNetwork from '..'

describe('Confirm Delete Network', function () {
  const mockState = {
    metamask: {},
    appState: {
      modal: {
        modalState: {
          name: 'CONFIRM_DELETE_NETWORK',
          props: {
            target: 'https://test.dapp',
          },
        },
      },
    },
  }

  afterEach(function () {
    sinon.restore()
  })

  it('clicks cancel to hide modal', function () {

    const store = configureStore()(mockState)

    const props = {
      hideModal: sinon.spy(),
      delRpcTarget: sinon.stub().resolves(),
      onConfirm: sinon.spy(),
    }

    const { getByText } = render(
      <ConfirmDeleteNetwork {...props} />, store,
    )

    const cancelButton = getByText(/cancel/u)
    fireEvent.click(cancelButton)

    assert.equal(store.getActions()[0].type, 'UI_MODAL_CLOSE')
  })

  it('clicks delete to delete the target', function () {
    const delRpcTargetSpy = sinon.stub(actions, 'delRpcTarget').returns(() => Promise.resolve())

    const store = configureStore([thunk])(mockState)

    const props = {
      hideModal: sinon.spy(),
      delRpcTarget: sinon.stub().returns(() => Promise.resolve()),
      onConfirm: sinon.spy(),
    }

    const { getByText } = render(
      <ConfirmDeleteNetwork {...props} />, store,
    )

    const deleteButton = getByText('[delete]')
    fireEvent.click(deleteButton)

    assert(delRpcTargetSpy.calledOnce)
    assert(delRpcTargetSpy.calledWith('https://test.dapp'))
  })

})
