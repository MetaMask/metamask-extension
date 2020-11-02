import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import CreateAccountPage from '..'

describe('Create Account Page', function () {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    location: {
      pathname: '/new-account',
    },
  }

  before(function () {
    wrapper = mountWithRouter(<CreateAccountPage {...props} />)
  })

  afterEach(function () {
    props.history.push.resetHistory()
  })

  it('clicks create account and routes to new-account path', function () {
    const createAccount = wrapper.find('.new-account__tabs__tab').at(0)
    createAccount.simulate('click')
    assert.equal(props.history.push.getCall(0).args[0], '/new-account')
  })

  it('clicks import account and routes to import new account path', function () {
    const importAccount = wrapper.find('.new-account__tabs__tab').at(1)
    importAccount.simulate('click')
    assert.equal(props.history.push.getCall(0).args[0], '/new-account/import')
  })

  it('clicks connect HD Wallet and routes to connect new account path', function () {
    const connectHdWallet = wrapper.find('.new-account__tabs__tab').at(2)
    connectHdWallet.simulate('click')
    assert.equal(props.history.push.getCall(0).args[0], '/new-account/connect')
  })
})
