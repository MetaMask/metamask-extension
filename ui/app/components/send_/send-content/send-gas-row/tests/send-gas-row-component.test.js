import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendGasRow from '../send-gas-row.component.js'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import GasFeeDisplay from '../gas-fee-display/gas-fee-display.component'

const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
}

describe('SendGasRow Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendGasRow
      conversionRate={20}
      convertedCurrency={'mockConvertedCurrency'}
      gasLoadingError={false}
      gasTotal={'mockGasTotal'}
      showCustomizeGasModal={propsMethodSpies.showCustomizeGasModal}
    />, { context: { t: str => str + '_t' } })
  })

  afterEach(() => {
    propsMethodSpies.showCustomizeGasModal.resetHistory()
  })

  describe('render', () => {
    it('should render a SendRowWrapper component', () => {
      assert.equal(wrapper.find(SendRowWrapper).length, 1)
    })

    it('should pass the correct props to SendRowWrapper', () => {
      const {
        label,
      } = wrapper.find(SendRowWrapper).props()

      assert.equal(label, 'gasFee_t:')
    })

    it('should render a GasFeeDisplay as a child of the SendRowWrapper', () => {
      assert(wrapper.find(SendRowWrapper).childAt(0).is(GasFeeDisplay))
    })

    it('should render the GasFeeDisplay with the correct props', () => {
      const {
        conversionRate,
        convertedCurrency,
        gasLoadingError,
        gasTotal,
        onClick,
      } = wrapper.find(SendRowWrapper).childAt(0).props()
      assert.equal(conversionRate, 20)
      assert.equal(convertedCurrency, 'mockConvertedCurrency')
      assert.equal(gasLoadingError, false)
      assert.equal(gasTotal, 'mockGasTotal')
      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 0)
      onClick()
      assert.equal(propsMethodSpies.showCustomizeGasModal.callCount, 1)
    })
  })
})
