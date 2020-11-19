import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ConfirmDeleteNetwork from '..'

describe('Confirm Delete Network', function () {
  let wrapper

  const props = {
    hideModal: sinon.spy(),
    delRpcTarget: sinon.stub().resolves(),
    onConfirm: sinon.spy(),
    target: '',
  }

  beforeEach(function () {
    wrapper = mount(<ConfirmDeleteNetwork.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    })
  })

  afterEach(function () {
    props.hideModal.resetHistory()
    props.delRpcTarget.resetHistory()
    props.onConfirm.resetHistory()
  })

  it('renders delete network modal title', function () {
    const modalTitle = wrapper.find('.modal-content__title')
    assert.equal(modalTitle.text(), 'deleteNetwork')
  })

  it('clicks cancel to hide modal', function () {
    const cancelButton = wrapper.find(
      '.button.btn-default.modal-container__footer-button',
    )
    cancelButton.simulate('click')

    assert(props.hideModal.calledOnce)
  })

  it('clicks delete to delete the target and hides modal', function () {
    const deleteButton = wrapper.find(
      '.button.btn-danger.modal-container__footer-button',
    )

    deleteButton.simulate('click')

    setImmediate(() => {
      assert(props.delRpcTarget.calledOnce)
      assert(props.hideModal.calledOnce)
      assert(props.onConfirm.calledOnce)
    })
  })
})
