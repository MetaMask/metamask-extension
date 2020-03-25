import React from 'react'
import { PropTypes } from 'prop-types'
import assert from 'assert'
import sinon from 'sinon'
import { mount } from 'enzyme'
import DepositEtherModal from '../deposit-ether-modal.component'

describe('Deposit Ether Modal Component', function () {
  let wrapper

  const props = {
    network: '1',
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    toWyre: sinon.spy(),
    toCoinSwitch: sinon.spy(),
    hideModal: sinon.spy(),
    hideWarning: sinon.spy(),
    showAccountDetailModal: sinon.spy(),
    toFaucet: sinon.spy(),
  }


  beforeEach(function () {

    wrapper = mount(
      <DepositEtherModal {...props} />, {
        context: {
          t: (str) => str,
        },
        childContextTypes: {
          t: PropTypes.func,
        },
      }
    )

  })

  afterEach(function () {
    props.hideWarning.resetHistory()
    props.hideModal.resetHistory()
    props.showAccountDetailModal.resetHistory()
    props.toWyre.resetHistory()
    props.toCoinSwitch.resetHistory()
    props.toFaucet.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  it('hides warning and modal when clicking the close icon/button', function () {
    const closeModal = wrapper.find('.page-container__header-close')

    closeModal.simulate('click')

    assert(props.hideWarning.calledOnce)
    assert(props.hideModal.calledOnce)

  })

  it('closes deposit modal and shows account details modal when clicking view account', function () {
    const viewAccount = wrapper.find('.deposit-ether-modal__deposit-button').at(1)

    viewAccount.simulate('click')

    assert(props.hideWarning.calledOnce)
    assert(props.hideModal.calledOnce)
    assert(props.showAccountDetailModal.calledOnce)

  })

  it('calls toWyre with the props address', function () {
    const wyre = wrapper.find('.deposit-ether-modal__deposit-button').at(3)
    wyre.simulate('click')

    assert(props.toWyre.calledOnce)
    assert.equal(props.toWyre.getCall(0).args[0], props.address)

  })

  it('calls toCoinSwitch with the props address', function () {
    const coinSwitch = wrapper.find('.deposit-ether-modal__deposit-button').at(5)
    coinSwitch.simulate('click')

    assert(props.toCoinSwitch.calledOnce)
    assert.equal(props.toCoinSwitch.getCall(0).args[0], props.address)
  })

  it('switches to test network and calls toFaucet to the associated network', function () {
    const network = '3'
    wrapper.setProps({ network })

    const testFaucet = wrapper.find('.deposit-ether-modal__deposit-button').at(3)
    testFaucet.simulate('click')

    assert(props.toFaucet.calledOnce)
    assert.equal(props.toFaucet.getCall(0).args[0], network)
  })

})
