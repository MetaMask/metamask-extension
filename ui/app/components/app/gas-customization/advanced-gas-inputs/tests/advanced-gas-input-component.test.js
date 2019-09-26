import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import AdvancedTabContent from '../advanced-gas-inputs.component'

describe('Advanced Gas Inputs', () => {
  let wrapper, clock

  const props = {
    updateCustomGasPrice: sinon.spy(),
    updateCustomGasLimit: sinon.spy(),
    showGasPriceInfoModal: sinon.spy(),
    showGasLimitInfoModal: sinon.spy(),
    customGasPrice: 0,
    customGasLimit: 0,
    insufficientBalance: false,
    customPriceIsSafe: true,
    isSpeedUp: false,
  }

  beforeEach(() => {
    clock = sinon.useFakeTimers()

    wrapper = shallow(
      <AdvancedTabContent
        {...props}
      />, {context: { t: str => str }})
  })

  afterEach(() => {
    clock.restore()
  })

  it('wont update gasPrice in props before debounce', () => {
    const event = { target: { value: 1 } }

    wrapper.find('input').at(0).simulate('change', event)
    clock.tick(499)

    assert.equal(props.updateCustomGasPrice.callCount, 0)
  })

  it('simulates onChange on gas price after debounce', () => {
    const event = { target: { value: 1 } }

    wrapper.find('input').at(0).simulate('change', event)
    clock.tick(500)

    assert.equal(props.updateCustomGasPrice.calledOnce, true)
    assert.equal(props.updateCustomGasPrice.calledWith(1), true)
  })

  it('wont update gasLimit in props before debounce', () => {
    const event = { target: { value: 21000 }}

    wrapper.find('input').at(1).simulate('change', event)
    clock.tick(499)

    assert.equal(props.updateCustomGasLimit.callCount, 0)
  })

  it('simulates onChange on gas limit after debounce', () => {
    const event = { target: { value: 21000 }}

    wrapper.find('input').at(1).simulate('change', event)
    clock.tick(500)

    assert.equal(props.updateCustomGasLimit.calledOnce, true)
    assert.equal(props.updateCustomGasLimit.calledWith(21000), true)
  })

  it('errors when insuffientBalance under gas price and gas limit', () => {
    wrapper.setProps({ insufficientBalance: true })

    const renderError = wrapper.find('.advanced-gas-inputs__gas-edit-row__error-text')
    assert.equal(renderError.length, 2)

    assert.equal(renderError.at(0).text(), 'insufficientBalance')
    assert.equal(renderError.at(1).text(), 'insufficientBalance')
  })

  it('errors zero gas price / speed up', () => {
    wrapper.setProps({ isSpeedUp: true })

    const renderError = wrapper.find('.advanced-gas-inputs__gas-edit-row__error-text')
    assert.equal(renderError.length, 1)

    assert.equal(renderError.text(), 'zeroGasPriceOnSpeedUpError')
  })

  it('warns when custom gas price is too low', () => {
    wrapper.setProps({ customPriceIsSafe: false })

    const renderWarning = wrapper.find('.advanced-gas-inputs__gas-edit-row__warning-text')
    assert.equal(renderWarning.length, 1)

    assert.equal(renderWarning.text(), 'gasPriceExtremelyLow')
  })
})
