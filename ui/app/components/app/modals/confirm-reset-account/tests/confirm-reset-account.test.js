import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ConfirmResetAccount from '../index'

describe('Confirm Reset Account', () => {
  let wrapper

  const props = {
    hideModal: sinon.spy(),
    resetAccount: sinon.stub().resolves(),
  }

  beforeEach(() => {
    wrapper = mount(
      <ConfirmResetAccount.WrappedComponent {...props} />, {
        context: {
          t: str => str,
        },
      }
    )
  })

  afterEach(() => {
    props.hideModal.resetHistory()
  })

  it('hides modal when nevermind button is clicked', () => {
    const nevermind = wrapper.find('.btn-default.modal-container__footer-button')
    nevermind.simulate('click')

    assert(props.hideModal.calledOnce)
  })

  it('resets account and hidels modal when reset button is clicked', (done) => {
    const reset = wrapper.find('.btn-secondary.modal-container__footer-button')
    reset.simulate('click')

    setImmediate(() => {
      assert(props.resetAccount.calledOnce)
      assert(props.hideModal.calledOnce)
      done()
    })
  })
})
