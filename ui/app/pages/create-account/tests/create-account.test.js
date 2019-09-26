import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import CreateAccountPage from '../index'

describe('Create Account Page', () => {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    location: {
      pathname: '/new-account',
    },
  }

  before(() => {
    wrapper = mountWithRouter(
      <CreateAccountPage.WrappedComponent {...props}/>
    )
  })

  afterEach(() => {
    props.history.push.resetHistory()
  })

  it('clicks create account and routes to new-account path', () => {
    const createAccount = wrapper.find('.new-account__tabs__tab').at(0)
    createAccount.simulate('click')
    assert.equal(props.history.push.getCall(0).args[0], '/new-account')
  })

  it('clicks import account and routes to import new account path', () => {
    const importAccount = wrapper.find('.new-account__tabs__tab').at(1)
    importAccount.simulate('click')
    assert.equal(props.history.push.getCall(0).args[0], '/new-account/import')
  })

  it('clicks connect HD Wallet and routes to connect new account path', () => {
    const connectHdWallet = wrapper.find('.new-account__tabs__tab').at(2)
    connectHdWallet.simulate('click')
    assert.equal(props.history.push.getCall(0).args[0], '/new-account/connect')
  })
})
