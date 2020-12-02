import assert from 'assert'
import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { calculateHexData } from '../../../send.utils'
import SendCaptchaRow from '../send-captcha-data-row.component'

import Hcaptcha from '../../../../../components/app/captcha'

const propsMethodSpies = {
  updateSendIsHcaptchaVerified: sinon.spy(),
  updateSendHexData: sinon.spy(),
  updateGas: sinon.spy(),
}

const props = {
  ...propsMethodSpies,
  hexData: '16f',
  isVerified: false
}

describe('SendCaptchaRow Component', function () {
  let wrapper
  let instance

  before(function () {
    sinon.spy(SendCaptchaRow.prototype, 'componentDidMount')
    sinon.spy(SendCaptchaRow.prototype, 'updateData')
    sinon.spy(SendCaptchaRow.prototype, 'onCaptchaVerified')
    sinon.spy(SendCaptchaRow.prototype, 'onCaptchaClosed')
  })

  beforeEach(function () {
    wrapper = mount(
      <SendCaptchaRow {...props} />,
      { context: { t: (str) => `${str}_t` } }
    )
    instance = wrapper.instance()
  })

  afterEach(function () {
    SendCaptchaRow.prototype.updateData.resetHistory()
    SendCaptchaRow.prototype.onCaptchaVerified.resetHistory()
    SendCaptchaRow.prototype.onCaptchaClosed.resetHistory()
    propsMethodSpies.updateSendIsHcaptchaVerified.resetHistory()
    propsMethodSpies.updateGas.resetHistory()
    propsMethodSpies.updateSendHexData.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  describe('componentDidMount', function () {
    it('should call componentDidMount once', function() {
      assert(SendCaptchaRow.prototype.componentDidMount.calledOnce)
    })

    it('should call updateData at componentDidMount', function () {
      SendCaptchaRow.prototype.updateData.resetHistory()
      assert.strictEqual(SendCaptchaRow.prototype.updateData.callCount, 0)
      instance.componentDidMount()
      assert.strictEqual(SendCaptchaRow.prototype.updateData.callCount, 1)
    })
  })

  describe('updateData', function() {
    it('should call updateData in user solve captcha puzzle', function() {
      SendCaptchaRow.prototype.updateData.resetHistory()
      SendCaptchaRow.prototype.onCaptchaVerified.resetHistory()
      assert.strictEqual(SendCaptchaRow.prototype.updateData.callCount, 0)
      instance.onCaptchaVerified()
      assert.strictEqual(SendCaptchaRow.prototype.updateData.callCount, 1)
    })

    it('should call updateData when user close the captcha', function() {
      SendCaptchaRow.prototype.updateData.resetHistory()
      SendCaptchaRow.prototype.onCaptchaClosed.resetHistory()
      assert.strictEqual(SendCaptchaRow.prototype.updateData.callCount, 0)
      instance.onCaptchaClosed()
      assert.strictEqual(SendCaptchaRow.prototype.updateData.callCount, 1)
    })

    it('should calculate gas with is_human=0 postfix in the transaction data if user has not solve the captcha puzzle', function() {
      propsMethodSpies.updateGas.resetHistory()
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 0)
      instance.updateData()
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 1)
      assert.deepEqual(propsMethodSpies.updateGas.getCall(0).args[0], {
        data: calculateHexData(props.hexData, false)
      })
    })

    it('should calculate gas with is_human=1 postfix in the transaction data if user has solve the captcha puzzle', function() {
      propsMethodSpies.updateGas.resetHistory();
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 0)
      wrapper.setProps({ isVerified: true })
      wrapper.instance().updateData()
      assert.strictEqual(propsMethodSpies.updateGas.callCount, 1)
      assert.deepEqual(propsMethodSpies.updateGas.getCall(0).args[0], {
        data: calculateHexData(props.hexData, true)
      })
    });

    it('should add is_human=0 postfix to the transaction data if user have not solved the captcha puzzle before', function() {
      propsMethodSpies.updateSendHexData.resetHistory();
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 0)
      instance.updateData();
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 1)
      assert.strictEqual(propsMethodSpies.updateSendHexData.getCall(0).args[0], calculateHexData(props.hexData, false))
    });

    it('should add is_human=1 postfix to the transaction data if user have solved the captcha puzzle before', function() {
      propsMethodSpies.updateSendHexData.resetHistory();
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 0)
      wrapper.setProps({ isVerified: true })
      wrapper.instance().updateData()
      assert.strictEqual(propsMethodSpies.updateSendHexData.callCount, 1)
      assert.strictEqual(propsMethodSpies.updateSendHexData.getCall(0).args[0], calculateHexData(props.hexData, true))
    });

    it('should call updateSendIsHcaptchaVerified in updateData if user is not verified', function() {
      propsMethodSpies.updateSendIsHcaptchaVerified.resetHistory();
      assert.strictEqual(propsMethodSpies.updateSendIsHcaptchaVerified.callCount, 0)
      wrapper.setProps({ isVerified: false })
      wrapper.instance().updateData()
      assert.strictEqual(propsMethodSpies.updateSendIsHcaptchaVerified.callCount, 1)
    });

    it('should not call updateSendIsHcaptchaVerified in updateData if user is already verified', function() {
      propsMethodSpies.updateSendIsHcaptchaVerified.resetHistory();
      assert.strictEqual(propsMethodSpies.updateSendIsHcaptchaVerified.callCount, 0)
      wrapper.setProps({ isVerified: true })
      wrapper.instance().updateData()
      assert.strictEqual(propsMethodSpies.updateSendIsHcaptchaVerified.callCount, 0)
    });
  })

  describe('render', function () {
    it('should render a SendCaptchaRow component with Hcaptcha inside', function () {
      assert.strictEqual(wrapper.name(), 'CaptchaRowComponent')
      assert.strictEqual(wrapper.at(0).find(Hcaptcha).length, 1)
    })
  })
})
