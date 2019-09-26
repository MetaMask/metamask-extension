import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import TransactionConfirmed from '../index'

describe('Transaction Confirmed', () => {
  let wrapper

  const props = {
    onSubmit: sinon.spy(),
    hideModal: sinon.spy(),
  }

  beforeEach(() => {
    wrapper = mount(
      <TransactionConfirmed.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  it('clicks ok to submit and hide modal', () => {
    const submit = wrapper.find('.btn-secondary.modal-container__footer-button')
    submit.simulate('click')

    assert(props.onSubmit.calledOnce)
    assert(props.hideModal.calledOnce)
  })
})
