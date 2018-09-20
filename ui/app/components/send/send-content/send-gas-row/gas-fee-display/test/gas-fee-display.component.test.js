import React from 'react'
import assert from 'assert'
import {shallow} from 'enzyme'
import GasFeeDisplay from '../gas-fee-display.component'
import CurrencyDisplay from '../../../../../send/currency-display'
import sinon from 'sinon'


const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
}

describe('SendGasRow Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<GasFeeDisplay
      conversionRate={20}
      gasTotal={'mockGasTotal'}
      primaryCurrency={'mockPrimaryCurrency'}
      convertedCurrency={'mockConvertedCurrency'}
      showGasButtonGroup={propsMethodSpies.showCustomizeGasModal}
    />, {context: {t: str => str + '_t'}})
  })

  afterEach(() => {
    propsMethodSpies.showCustomizeGasModal.resetHistory()
  })

  describe('render', () => {
    it('should render a CurrencyDisplay component', () => {
      assert.equal(wrapper.find(CurrencyDisplay).length, 1)
    })

    it('should render the CurrencyDisplay with the correct props', () => {
      const {
        conversionRate,
        convertedCurrency,
        value,
      } = wrapper.find(CurrencyDisplay).props()
      assert.equal(conversionRate, 20)
      assert.equal(convertedCurrency, 'mockConvertedCurrency')
      assert.equal(value, 'mockGasTotal')
    })

    it('should render the reset button with the correct props', () => {
      const {
        onClick,
        className,
      } = wrapper.find('button').props()
      assert.equal(className, 'gas-fee-reset')
      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 0)
      onClick()
      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 1)
    })

    it('should render the reset button with the correct text', () => {
      assert.equal(wrapper.find('button').text(), 'reset_t')
    })
  })
})
