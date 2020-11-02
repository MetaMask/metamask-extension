import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import TransactionConfirmed from '..'

describe('Transaction Confirmed', function () {
  it('clicks ok to submit and hide modal', function () {
    const props = {
      onSubmit: sinon.spy(),
      hideModal: sinon.spy(),
    }
    const wrapper = mount(
      <TransactionConfirmed.WrappedComponent {...props} />,
      {
        context: {
          t: (str) => str,
        },
      },
    )
    const submit = wrapper.find('.btn-secondary.modal-container__footer-button')
    submit.simulate('click')

    assert(props.onSubmit.calledOnce)
    assert(props.hideModal.calledOnce)
  })
})
