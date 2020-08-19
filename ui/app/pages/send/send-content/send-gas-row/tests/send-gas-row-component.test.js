import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendGasRow from '../send-gas-row.component'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import GasFeeDisplay from '../gas-fee-display/gas-fee-display.component'
import GasPriceButtonGroup from '../../../../../components/app/gas-customization/gas-price-button-group'

const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
  resetGasButtons: sinon.spy(),
}

describe('SendGasRow Component', function () {
  let wrapper

  describe('render', function () {
    beforeEach(function () {
      wrapper = shallow((
        <SendGasRow
          conversionRate={20}
          convertedCurrency="mockConvertedCurrency"
          gasFeeError
          gasLoadingError={false}
          gasTotal="mockGasTotal"
          gasButtonGroupShown={false}
          showCustomizeGasModal={propsMethodSpies.showCustomizeGasModal}
          resetGasButtons={propsMethodSpies.resetGasButtons}
          gasPriceButtonGroupProps={{
            someGasPriceButtonGroupProp: 'foo',
            anotherGasPriceButtonGroupProp: 'bar',
          }}
        />
      ), { context: { t: (str) => `${str}_t`, metricsEvent: () => ({}) } })
      wrapper.setProps({ isMainnet: true })
    })

    afterEach(function () {
      propsMethodSpies.resetGasButtons.resetHistory()
    })

    it('should render a SendRowWrapper component', function () {
      assert.equal(wrapper.find(SendRowWrapper).length, 1)
    })

    it('should pass the correct props to SendRowWrapper', function () {
      const {
        label,
        showError,
        errorType,
      } = wrapper.find(SendRowWrapper).props()

      assert.equal(label, 'transactionFee_t:')
      assert.equal(showError, true)
      assert.equal(errorType, 'gasFee')
    })

    it('should render a GasFeeDisplay as a child of the SendRowWrapper', function () {
      assert(wrapper.find(SendRowWrapper).childAt(0).is(GasFeeDisplay))
    })

    it('should render the GasFeeDisplay', function () {
      const {
        gasLoadingError,
        gasTotal,
        onReset,
      } = wrapper.find(SendRowWrapper).childAt(0).props()
      assert.equal(gasLoadingError, false)
      assert.equal(gasTotal, 'mockGasTotal')
      assert.equal(propsMethodSpies.resetGasButtons.callCount, 0)
      onReset()
      assert.equal(propsMethodSpies.resetGasButtons.callCount, 1)
    })

    it('should render the GasPriceButtonGroup if gasButtonGroupShown is true', function () {
      wrapper.setProps({ gasButtonGroupShown: true })
      const rendered = wrapper.find(SendRowWrapper).childAt(0)
      assert.equal(rendered.children().length, 2)

      const gasPriceButtonGroup = rendered.childAt(0)
      assert(gasPriceButtonGroup.is(GasPriceButtonGroup))
      assert(gasPriceButtonGroup.hasClass('gas-price-button-group--small'))
      assert.equal(gasPriceButtonGroup.props().showCheck, false)
      assert.equal(gasPriceButtonGroup.props().someGasPriceButtonGroupProp, 'foo')
      assert.equal(gasPriceButtonGroup.props().anotherGasPriceButtonGroupProp, 'bar')
    })

    it('should render an advanced options button if gasButtonGroupShown is true', function () {
      wrapper.setProps({ gasButtonGroupShown: true })
      const rendered = wrapper.find(SendRowWrapper).childAt(0)
      assert.equal(rendered.children().length, 2)

      const advancedOptionsButton = rendered.childAt(1)
      assert.equal(advancedOptionsButton.text(), 'advancedOptions_t')

      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 0)
      advancedOptionsButton.props().onClick()
      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 1)
    })
  })
})
