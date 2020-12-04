import assert from 'assert'
import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { calculateHexData } from '../../../send.utils'
import SendHexDataRow from '../send-hex-data-row.component'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'

const eventMock = {
  target: {
    value: '16f10a'
  }
}

const propsMethodSpies = {
  updateSendHexData: sinon.spy(),
  updateGas: sinon.spy(),
}

const props = {
  ...propsMethodSpies,
  isHcaptchaVerified: false
}

describe('SendHexDataRow Component', function () {
  let wrapper
  let instance

  before(function () {
    sinon.spy(SendHexDataRow.prototype, 'onInput')
  })

  beforeEach(function () {
    wrapper = mount(
      <SendHexDataRow {...props} />,
      { context: { t: (str) => `${str}_t` } }
    )
    instance = wrapper.instance()
  })

  afterEach(function () {
    SendHexDataRow.prototype.onInput.resetHistory()
    propsMethodSpies.updateGas.resetHistory()
    propsMethodSpies.updateSendHexData.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  describe('onInput', function() {
    it('should calculate gas with is_human=0 postfix in the transaction data if user is not verified by hcaptcha', function() {
      propsMethodSpies.updateGas.resetHistory()
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 0)
      instance.onInput(eventMock)
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 1)
      assert.deepEqual(propsMethodSpies.updateGas.getCall(0).args[0], {
        data: calculateHexData(eventMock.target.value, false)
      })
    })

    it('should calculate gas with is_human=1 postfix in the transaction data if user is verified by hcaptcha', function() {
      propsMethodSpies.updateGas.resetHistory()
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 0)
      wrapper.setProps({ isHcaptchaVerified: true })
      wrapper.instance().onInput(eventMock)
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 1)
      assert.deepEqual(propsMethodSpies.updateGas.getCall(0).args[0], {
        data: calculateHexData(eventMock.target.value, true)
      })
    })

    it('should add is_human=0 postfix to the transaction data data if user is not verified by hcaptcha', function() {
      propsMethodSpies.updateSendHexData.resetHistory()
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 0)
      instance.onInput(eventMock)
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 1)
      assert.strictEqual(propsMethodSpies.updateSendHexData.getCall(0).args[0], calculateHexData(eventMock.target.value, false))
    })

    it('should add is_human=1 postfix to the transaction data if user is verified by hcaptcha', function() {
      propsMethodSpies.updateSendHexData.resetHistory()
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 0)
      wrapper.setProps({ isHcaptchaVerified: true })
      wrapper.instance().onInput(eventMock)
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 1)
      assert.strictEqual(propsMethodSpies.updateSendHexData.getCall(0).args[0], calculateHexData(eventMock.target.value, true))
    })
  })

  describe('render', function () {
    it('should render a SendHexDataRow component with textarea inside', function () {
      assert.strictEqual(wrapper.name(), 'SendHexDataRow')
      assert.strictEqual(wrapper.at(0).find(SendRowWrapper).length, 1)
      assert.strictEqual(wrapper.at(0).at(0).find('textarea').length, 1)
    })
  })
})
