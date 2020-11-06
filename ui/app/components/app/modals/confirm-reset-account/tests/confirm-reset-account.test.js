import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import ConfirmResetAccount from '..'

describe('Confirm Reset Account', function () {
  let wrapper

  const props = {
    hideModal: sinon.spy(),
    resetAccount: sinon.stub().resolves(),
  }

  beforeEach(function () {
    wrapper = mount(<ConfirmResetAccount.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    })
  })

  afterEach(function () {
    props.hideModal.resetHistory()
  })

  it('hides modal when nevermind button is clicked', function () {
    const nevermind = wrapper.find(
      '.btn-default.modal-container__footer-button',
    )
    nevermind.simulate('click')

    assert(props.hideModal.calledOnce)
  })

  it('resets account and hides modal when reset button is clicked', function (done) {
    const reset = wrapper.find('.btn-danger.modal-container__footer-button')
    reset.simulate('click')

    setImmediate(() => {
      assert(props.resetAccount.calledOnce)
      assert(props.hideModal.calledOnce)
      done()
    })
  })
})
