import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendAmountRow from '../send-amount-row.component.js'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import AmountMaxButton from '../amount-max-button/amount-max-button.container'
import CurrencyDisplay from '../../../../send/currency-display'

const propsMethodSpies = {
  setMaxModeTo: sinon.spy(),
  updateSendAmount: sinon.spy(),
  updateSendAmountError: sinon.spy(),
}

sinon.spy(SendAmountRow.prototype, 'handleAmountChange')
sinon.spy(SendAmountRow.prototype, 'validateAmount')

describe('SendAmountRow Component', function () {
  let wrapper
  let instance

  beforeEach(() => {
    wrapper = shallow(<SendAmountRow
      amount={'mockAmount'}
      amountConversionRate={'mockAmountConversionRate'}
      balance={'mockBalance'}
      conversionRate={7}
      convertedCurrency={'mockConvertedCurrency'}
      gasTotal={'mockGasTotal'}
      inError={false}
      primaryCurrency={'mockPrimaryCurrency'}
      selectedToken={ { address: 'mockTokenAddress' } }
      setMaxModeTo={propsMethodSpies.setMaxModeTo}
      tokenBalance={'mockTokenBalance'}
      updateSendAmount={propsMethodSpies.updateSendAmount}
      updateSendAmountError={propsMethodSpies.updateSendAmountError}
    />, { context: { t: str => str + '_t' } })
    instance = wrapper.instance()
  })

  afterEach(() => {
    propsMethodSpies.setMaxModeTo.resetHistory()
    propsMethodSpies.updateSendAmount.resetHistory()
    propsMethodSpies.updateSendAmountError.resetHistory()
    SendAmountRow.prototype.validateAmount.resetHistory()
    SendAmountRow.prototype.handleAmountChange.resetHistory()
  })

  describe('validateAmount', () => {

    it('should call updateSendAmountError with the correct params', () => {
      assert.equal(propsMethodSpies.updateSendAmountError.callCount, 0)
      instance.validateAmount('someAmount')
      assert.equal(propsMethodSpies.updateSendAmountError.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendAmountError.getCall(0).args,
        [{
          amount: 'someAmount',
          amountConversionRate: 'mockAmountConversionRate',
          balance: 'mockBalance',
          conversionRate: 7,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          selectedToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        }]
      )
    })

  })

  describe('handleAmountChange', () => {

    it('should call setMaxModeTo', () => {
      assert.equal(propsMethodSpies.setMaxModeTo.callCount, 0)
      instance.handleAmountChange('someAmount')
      assert.equal(propsMethodSpies.setMaxModeTo.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.setMaxModeTo.getCall(0).args,
        [false]
      )
    })

    it('should call this.validateAmount', () => {
      assert.equal(SendAmountRow.prototype.validateAmount.callCount, 0)
      instance.handleAmountChange('someAmount')
      assert.equal(SendAmountRow.prototype.validateAmount.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendAmount.getCall(0).args,
        ['someAmount']
      )
    })

    it('should call updateSendAmount', () => {
      assert.equal(propsMethodSpies.updateSendAmount.callCount, 0)
      instance.handleAmountChange('someAmount')
      assert.equal(propsMethodSpies.updateSendAmount.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateSendAmount.getCall(0).args,
        ['someAmount']
      )
    })

  })

  describe('render', () => {
    it('should render a SendRowWrapper component', () => {
      assert.equal(wrapper.find(SendRowWrapper).length, 1)
    })

    it('should pass the correct props to SendRowWrapper', () => {
      const {
        errorType,
        label,
        showError,
      } = wrapper.find(SendRowWrapper).props()

      assert.equal(errorType, 'amount')

      assert.equal(label, 'amount_t:')

      assert.equal(showError, false)
    })

    it('should render an AmountMaxButton as the first child of the SendRowWrapper', () => {
      assert(wrapper.find(SendRowWrapper).childAt(0).is(AmountMaxButton))
    })

    it('should render a CurrencyDisplay as the second child of the SendRowWrapper', () => {
      assert(wrapper.find(SendRowWrapper).childAt(1).is(CurrencyDisplay))
    })

    it('should render the CurrencyDisplay with the correct props', () => {
      const {
        conversionRate,
        convertedCurrency,
        handleChange,
        inError,
        primaryCurrency,
        selectedToken,
        value,
      } = wrapper.find(SendRowWrapper).childAt(1).props()
      assert.equal(conversionRate, 'mockAmountConversionRate')
      assert.equal(convertedCurrency, 'mockConvertedCurrency')
      assert.equal(inError, false)
      assert.equal(primaryCurrency, 'mockPrimaryCurrency')
      assert.deepEqual(selectedToken, { address: 'mockTokenAddress' })
      assert.equal(value, 'mockAmount')
      assert.equal(SendAmountRow.prototype.handleAmountChange.callCount, 0)
      handleChange('mockNewAmount')
      assert.equal(SendAmountRow.prototype.handleAmountChange.callCount, 1)
      assert.deepEqual(
        SendAmountRow.prototype.handleAmountChange.getCall(0).args,
        ['mockNewAmount']
      )
    })

    it('should pass the default primaryCurrency to the CurrencyDisplay if primaryCurrency is falsy', () => {
      wrapper.setProps({ primaryCurrency: null })
      const { primaryCurrency } = wrapper.find(SendRowWrapper).childAt(1).props()
      assert.equal(primaryCurrency, 'ETH')
    })
  })
})
