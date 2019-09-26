import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import RejectTransactionsModal from '../index'

describe('Reject Transactions Model', () => {
  let wrapper

  const props = {
    onSubmit: sinon.spy(),
    hideModal: sinon.spy(),
    unapprovedTxCount: 2,
  }

  beforeEach(() => {
    wrapper = mount(
      <RejectTransactionsModal.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  afterEach(() => {
    props.hideModal.resetHistory()
  })

  it('hides modal when cancel button is clicked', () => {
    const cancelButton = wrapper.find('.btn-default.modal-container__footer-button')
    cancelButton.simulate('click')

    assert(props.hideModal.calledOnce)
  })

  it('onSubmit is called and hides modal when reject all clicked', (done) => {
    const rejectAllButton = wrapper.find('.btn-secondary.modal-container__footer-button')
    rejectAllButton.simulate('click')

    setImmediate(() => {
      assert(props.onSubmit.calledOnce)
      assert(props.hideModal.calledOnce)
      done()
    })

  })
})
