import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow, mount } from 'enzyme'
import CurrencyDisplay from '../currency-display'

describe('', () => {

  const token = {
    address: '0xTest',
    symbol: 'TST',
    decimals: '13',
  }

  it('retuns ETH value for wei value', () => {
    const wrapper = mount(<CurrencyDisplay />, {context: {t: str => str + '_t'}})

    const value = wrapper.instance().getValueToRender({
      // 1000000000000000000
      value: 'DE0B6B3A7640000',
    })

    assert.equal(value, 1)
  })

  it('returns value of token based on token decimals', () => {
    const wrapper = mount(<CurrencyDisplay />, {context: {t: str => str + '_t'}})

    const value = wrapper.instance().getValueToRender({
      selectedToken: token,
      // 1000000000000000000
      value: 'DE0B6B3A7640000',
    })

    assert.equal(value, 100000)
  })

  it('returns hex value with decimal adjustment', () => {

    const wrapper = mount(
      <CurrencyDisplay
        selectedToken={token}
      />, {context: {t: str => str + '_t'}})

    const value = wrapper.instance().getAmount(1)
    // 10000000000000
    assert.equal(value, '9184e72a000')
  })

  it('#getConvertedValueToRender converts input value based on conversionRate', () => {

    const wrapper = mount(
      <CurrencyDisplay
        primaryCurrency={'usd'}
        convertedCurrency={'ja'}
        conversionRate={2}
      />, {context: {t: str => str + '_t'}})

    const value = wrapper.instance().getConvertedValueToRender(32)

    assert.equal(value, 64)
  })

  it('#onlyRenderConversions renders single element for converted currency and value', () => {
    const wrapper = mount(
      <CurrencyDisplay
        convertedCurrency={'test'}
      />, {context: {t: str => str + '_t'}})

    const value = wrapper.instance().onlyRenderConversions(10)
    assert.equal(value.props.className, 'currency-display__converted-value')
    assert.equal(value.props.children, '10 TEST')
  })

  it('simulates change value in input', () => {
    const handleChangeSpy = sinon.spy()

    const wrapper = shallow(
      <CurrencyDisplay
        onChange={handleChangeSpy}
      />, {context: {t: str => str + '_t'}})

    const input = wrapper.find('input')
    input.simulate('focus')
    input.simulate('change', { target: { value: '100' } })

    assert.equal(wrapper.state().valueToRender, '100')
    assert.equal(wrapper.find('input').prop('value'), '100')
  })

})
