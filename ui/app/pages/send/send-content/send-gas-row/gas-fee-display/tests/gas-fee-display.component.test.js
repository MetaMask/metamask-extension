import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import GasFeeDisplay from '../gas-fee-display.component'
import UserPreferencedCurrencyDisplay from '../../../../../../components/app/user-preferenced-currency-display'

const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
  onReset: sinon.spy(),
}

describe('GasFeeDisplay Component', function () {
  let wrapper

  describe('render', function () {
    beforeEach(function () {
      wrapper = shallow(
        <GasFeeDisplay
          conversionRate={20}
          gasTotal="mockGasTotal"
          primaryCurrency="mockPrimaryCurrency"
          convertedCurrency="mockConvertedCurrency"
          showGasButtonGroup={propsMethodSpies.showCustomizeGasModal}
          onReset={propsMethodSpies.onReset}
        />,
        { context: { t: (str) => `${str}_t` } },
      )
    })

    afterEach(function () {
      propsMethodSpies.showCustomizeGasModal.resetHistory()
    })

    it('should render a CurrencyDisplay component', function () {
      assert.equal(wrapper.find(UserPreferencedCurrencyDisplay).length, 2)
    })

    it('should render the CurrencyDisplay with the correct props', function () {
      const { type, value } = wrapper
        .find(UserPreferencedCurrencyDisplay)
        .at(0)
        .props()
      assert.equal(type, 'PRIMARY')
      assert.equal(value, 'mockGasTotal')
    })

    it('should render the reset button with the correct props', function () {
      const { onClick, className } = wrapper.find('button').props()
      assert.equal(className, 'gas-fee-reset')
      assert.equal(propsMethodSpies.onReset.callCount, 0)
      onClick()
      assert.equal(propsMethodSpies.onReset.callCount, 1)
    })

    it('should render the reset button with the correct text', function () {
      assert.equal(wrapper.find('button').text(), 'reset_t')
    })
  })
})
