import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureStore from 'redux-mock-store'
import { mount } from 'enzyme'
import ConfirmRemoveAccount from '../index'

describe('Confirm Remove Account', () => {
  let wrapper

  const state = {
    metamask: {

    },
  }

  const props = {
    hideModal: sinon.spy(),
    removeAccount: sinon.stub().resolves(),
    network: '101',
    identity: {
      address: '0xAddress',
      name: 'Account 1',
    },
  }


  const mockStore = configureStore()
  const store = mockStore(state)

  beforeEach(() => {
    wrapper = mount(
      <ConfirmRemoveAccount.WrappedComponent {...props} />, {
        context: {
          t: str => str,
          store,
        },
        childContextTypes: {
          store: React.PropTypes.object,
        },
      }
    )
  })

  afterEach(() => {
    props.hideModal.resetHistory()
  })

  it('nevermind', () => {
    const nevermind = wrapper.find({ type: 'default'})
    nevermind.simulate('click')

    assert(props.hideModal.calledOnce)
  })

  it('remove', (done) => {
    const remove = wrapper.find({ type: 'secondary'})
    remove.simulate('click')

    assert(props.removeAccount.calledOnce)
    assert.equal(props.removeAccount.getCall(0).args[0], props.identity.address)

    setImmediate(() => {
      assert(props.hideModal.calledOnce)
      done()
    })

  })

  it('closes', () => {
    const close = wrapper.find('.modal-container__header-close')
    close.simulate('click')

    assert(props.hideModal.calledOnce)
  })
})
