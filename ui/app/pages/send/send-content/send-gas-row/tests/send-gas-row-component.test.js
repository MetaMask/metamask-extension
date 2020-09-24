import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendGasRow from '../send-gas-row.component.js'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import AdvancedGasInputs from '../../../../../components/app/gas-customization/advanced-gas-inputs'
import GasPriceButtonGroup from '../../../../../components/app/gas-customization/gas-price-button-group'

const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
  resetGasButtons: sinon.spy(),
}

describe('SendGasRow Component with advancedInlineGasShown on', function () {
  let wrapper

  describe('render', function () {
    beforeEach(function () {
      wrapper = shallow(
        <SendGasRow
          advancedInlineGasShown
          conversionRate={20}
          convertedCurrency="mockConvertedCurrency"
          gasAndCollateralFeeError
          gasLoadingError={false}
          gasTotal="mockGasTotal"
          gasButtonGroupShown={false}
          showCustomizeGasModal={propsMethodSpies.showCustomizeGasModal}
          resetGasButtons={propsMethodSpies.resetGasButtons}
          gasPriceButtonGroupProps={{
            someGasPriceButtonGroupProp: 'foo',
            anotherGasPriceButtonGroupProp: 'bar',
          }}
        />,
        { context: { t: (str) => str + '_t', metricsEvent: () => ({}) } }
      )
    })

    afterEach(function () {
      propsMethodSpies.resetGasButtons.resetHistory()
    })

    it('should render a SendRowWrapper component', function () {
      assert.equal(wrapper.find(SendRowWrapper).length, 2)
    })

    it('should pass the correct props to SendRowWrapper', function () {
      const { label, showError, errorType } = wrapper
        .find(SendRowWrapper)
        .at(0)
        .props()

      assert.equal(label, 'transactionFee_t:')
      assert.equal(showError, true)
      assert.equal(errorType, 'gasAndCollateralFee')
    })

    it('should render an AdvancedGasInputs as a child of the SendRowWrapper', function () {
      assert(
        wrapper
          .find(SendRowWrapper)
          .at(0)
          .childAt(0)
          .childAt(0)
          .is(AdvancedGasInputs)
      )
    })

    it.skip('should render the GasFeeDisplay', function () {
      const { gasLoadingError, gasTotal, onReset } = wrapper
        .find(SendRowWrapper)
        .at(0)
        .childAt(0)
        .props()
      assert.equal(gasLoadingError, false)
      assert.equal(gasTotal, 'mockGasTotal')
      assert.equal(propsMethodSpies.resetGasButtons.callCount, 0)
      onReset()
      assert.equal(propsMethodSpies.resetGasButtons.callCount, 1)
    })

    it.skip('should render the GasPriceButtonGroup if gasButtonGroupShown is true', function () {
      wrapper.setProps({ gasButtonGroupShown: true })
      const rendered = wrapper
        .find(SendRowWrapper)
        .at(0)
        .childAt(0)
      assert.equal(rendered.children().length, 1)

      const gasPriceButtonGroup = rendered.childAt(0)
      assert(gasPriceButtonGroup.is(GasPriceButtonGroup))
      assert(gasPriceButtonGroup.hasClass('gas-price-button-group--small'))
      assert.equal(gasPriceButtonGroup.props().showCheck, false)
      assert.equal(
        gasPriceButtonGroup.props().someGasPriceButtonGroupProp,
        'foo'
      )
      assert.equal(
        gasPriceButtonGroup.props().anotherGasPriceButtonGroupProp,
        'bar'
      )
    })

    it.skip('should render an advanced options button if gasButtonGroupShown is true', function () {
      wrapper.setProps({ gasButtonGroupShown: true })
      const rendered = wrapper
        .find(SendRowWrapper)
        .at(0)
        .childAt(0)
      assert.equal(rendered.children().length, 1)

      // const advancedOptionsButton = rendered.childAt(1)
      // assert.equal(advancedOptionsButton.text(), 'advancedOptions_t')

      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 0)
      // advancedOptionsButton.props().onClick()
      // assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 1)
    })
  })
})
