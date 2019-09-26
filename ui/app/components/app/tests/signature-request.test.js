import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import SignatureRequest from '../signature-request'

describe('Signature Request', () => {
  let wrapper

  const mockStore = {
    metamask: {},
  }
  const store = configureMockStore()(mockStore)

  const props = {
    history: {
      push: sinon.spy(),
    },
    clearConfirmTransaction: sinon.spy(),
    cancelMessage: sinon.spy(),
    cancel: sinon.stub().resolves(),
    sign: sinon.stub().resolves(),
    txData: {
      msgParams: {
        id: 1,
        data: '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
        from: '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5',
        origin: 'test.domain',
      },
      status: 'unapproved',
      time: 1,
      type: 'eth_sign',
    },
  }

  beforeEach(() => {
    wrapper = mountWithRouter(
      <SignatureRequest.WrappedComponent {...props} />, store
    )
  })

  afterEach(() => {
    props.clearConfirmTransaction.resetHistory()
  })
  
  it('cancel', (done) => {
    const cancelButton = wrapper.find('.button.btn-default.btn--large.request-signature__footer__cancel-button')
    cancelButton.simulate('click')

    setImmediate(() => {
      assert(props.cancel.calledOnce)
      assert.equal(props.clearConfirmTransaction.callCount, 1)
      assert.equal(props.history.push.getCall(0).args[0], '/')
      done()
    })
  })

  it('sign', (done) => {
    const signButton = wrapper.find('button.btn-secondary.btn--large.request-signature__footer__sign-button')
    signButton.simulate('click')

    setImmediate(() => {
      assert(props.sign.calledOnce)
      assert.equal(props.clearConfirmTransaction.callCount, 1)
      assert.equal(props.history.push.getCall(0).args[0], '/')
      done()
    })
  })

})
