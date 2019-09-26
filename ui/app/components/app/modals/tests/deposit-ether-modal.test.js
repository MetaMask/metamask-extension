import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
import DepositEtherModal from '../deposit-ether-modal'

describe('Deposit Ether Modal', () => {
  let wrapper

  const mockStore = {
    metamask: {},
  }

  const store = configureMockStore()(mockStore)

  const props = {
    toWyre: sinon.spy(),
    toCoinSwitch: sinon.spy(),
    hideModal: sinon.spy(),
    hideWarning: sinon.spy(),
    showAccountDetailModal: sinon.spy(),
    toFaucet: sinon.spy(),
  }


  beforeEach(() => {

    wrapper = mount(
      <DepositEtherModal {...props} store={store} />, {
        context: {
          t: str => str,
        },
        childContextTypes: {
          t: React.PropTypes.func,
        },
      }
    )

  })

  afterEach(() => {
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })
})
