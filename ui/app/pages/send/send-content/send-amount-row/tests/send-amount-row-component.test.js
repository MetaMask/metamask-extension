import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendAmountRow from '../send-amount-row.component.js'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import AmountMaxButton from '../amount-max-button/amount-max-button.container'
import UserPreferencedTokenInput from '../../../../../components/app/user-preferenced-token-input'

const propsMethodSpies = {
  setMaxModeTo: sinon.spy(),
  updateSendAmount: sinon.spy(),
  updateSendAmountError: sinon.spy(),
  updateGas: sinon.spy(),
  updateGasFeeError: sinon.spy(),
}

sinon.spy(SendAmountRow.prototype, 'updateAmount')
sinon.spy(SendAmountRow.prototype, 'validateAmount')
sinon.spy(SendAmountRow.prototype, 'updateGas')

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
      updateGasFeeError={propsMethodSpies.updateGasFeeError}
      updateSendAmount={propsMethodSpies.updateSendAmount}
      updateSendAmountError={propsMethodSpies.updateSendAmountError}
      updateGas={propsMethodSpies.updateGas}
    />, { context: { t: str => str + '_t' } })
    instance = wrapper.instance()
  })

  afterEach(() => {
    propsMethodSpies.setMaxModeTo.resetHistory()
    propsMethodSpies.updateSendAmount.resetHistory()
    propsMethodSpies.updateSendAmountError.resetHistory()
    propsMethodSpies.updateGasFeeError.resetHistory()
    SendAmountRow.prototype.validateAmount.resetHistory()
    SendAmountRow.prototype.updateAmount.resetHistory()
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

    it('should call updateGasFeeError if selectedToken is truthy', () => {
      assert.equal(propsMethodSpies.updateGasFeeError.callCount, 0)
      instance.validateAmount('someAmount')
      assert.equal(propsMethodSpies.updateGasFeeError.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.updateGasFeeError.getCall(0).args,
        [{
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

    it('should call not updateGasFeeError if selectedToken is falsey', () => {
      wrapper.setProps({ selectedToken: null })
      assert.equal(propsMethodSpies.updateGasFeeError.callCount, 0)
      instance.validateAmount('someAmount')
      assert.equal(propsMethodSpies.updateGasFeeError.callCount, 0)
    })

  })

  describe('updateAmount', () => {

    it('should call setMaxModeTo', () => {
      assert.equal(propsMethodSpies.setMaxModeTo.callCount, 0)
      instance.updateAmount('someAmount')
      assert.equal(propsMethodSpies.setMaxModeTo.callCount, 1)
      assert.deepEqual(
        propsMethodSpies.setMaxModeTo.getCall(0).args,
        [false]
      )
    })

    it('should call updateSendAmount', () => {
      assert.equal(propsMethodSpies.updateSendAmount.callCount, 0)
      instance.updateAmount('someAmount')
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

    it('should render a UserPreferencedTokenInput as the second child of the SendRowWrapper', () => {
      assert(wrapper.find(SendRowWrapper).childAt(1).is(UserPreferencedTokenInput))
    })

    it('should render the UserPreferencedTokenInput with the correct props', () => {
      const {
        onBlur,
        onChange,
        error,
        value,
      } = wrapper.find(SendRowWrapper).childAt(1).props()
      assert.equal(error, false)
      assert.equal(value, 'mockAmount')
      assert.equal(SendAmountRow.prototype.updateGas.callCount, 0)
      assert.equal(SendAmountRow.prototype.updateAmount.callCount, 0)
      onBlur('mockNewAmount')
      assert.equal(SendAmountRow.prototype.updateGas.callCount, 1)
      assert.deepEqual(
        SendAmountRow.prototype.updateGas.getCall(0).args,
        ['mockNewAmount']
      )
      assert.equal(SendAmountRow.prototype.updateAmount.callCount, 1)
      assert.deepEqual(
        SendAmountRow.prototype.updateAmount.getCall(0).args,
        ['mockNewAmount']
      )
      assert.equal(SendAmountRow.prototype.validateAmount.callCount, 0)
      onChange('mockNewAmount')
      assert.equal(SendAmountRow.prototype.validateAmount.callCount, 1)
      assert.deepEqual(
        SendAmountRow.prototype.validateAmount.getCall(0).args,
        ['mockNewAmount']
      )
    })
  })
})
