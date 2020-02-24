import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import SendAmountRow from '../send-amount-row.component.js'

import SendRowWrapper from '../../send-row-wrapper/send-row-wrapper.component'
import AmountMaxButton from '../amount-max-button/amount-max-button.container'
import UserPreferencedTokenInput from '../../../../../components/app/user-preferenced-token-input'

<<<<<<< HEAD
import timeout from '../../../../../../lib/test-timeout'

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
      amount="mockAmount"
      amountConversionRate="mockAmountConversionRate"
      balance="mockBalance"
      conversionRate={7}
      convertedCurrency="mockConvertedCurrency"
      gasTotal="mockGasTotal"
      inError={false}
      primaryCurrency="mockPrimaryCurrency"
      selectedToken={ { address: 'mockTokenAddress' } }
      setMaxModeTo={propsMethodSpies.setMaxModeTo}
      tokenBalance="mockTokenBalance"
      updateGasFeeError={propsMethodSpies.updateGasFeeError}
      updateSendAmount={propsMethodSpies.updateSendAmount}
      updateSendAmountError={propsMethodSpies.updateSendAmountError}
      updateGas={propsMethodSpies.updateGas}
    />, { context: { t: str => str + '_t' } })
    instance = wrapper.instance()
  })
=======
describe('SendAmountRow Component', function () {
  describe('validateAmount', function () {
    it('should call updateSendAmountError with the correct params', function () {
      const { instance, propsMethodSpies: { updateSendAmountError } } = shallowRenderSendAmountRow()
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

      assert.equal(updateSendAmountError.callCount, 0)

      instance.validateAmount('someAmount')

      assert.ok(updateSendAmountError.calledOnceWithExactly({
        amount: 'someAmount',
        amountConversionRate: 'mockAmountConversionRate',
        balance: 'mockBalance',
        conversionRate: 7,
        gasTotal: 'mockGasTotal',
        primaryCurrency: 'mockPrimaryCurrency',
        selectedToken: { address: 'mockTokenAddress' },
        tokenBalance: 'mockTokenBalance',
      }))
    })

    it('should call updateGasFeeError if selectedToken is truthy', function () {
      const { instance, propsMethodSpies: { updateGasFeeError } } = shallowRenderSendAmountRow()

      assert.equal(updateGasFeeError.callCount, 0)

      instance.validateAmount('someAmount')

      assert.ok(updateGasFeeError.calledOnceWithExactly({
        amountConversionRate: 'mockAmountConversionRate',
        balance: 'mockBalance',
        conversionRate: 7,
        gasTotal: 'mockGasTotal',
        primaryCurrency: 'mockPrimaryCurrency',
        selectedToken: { address: 'mockTokenAddress' },
        tokenBalance: 'mockTokenBalance',
      }))
    })

    it('should call not updateGasFeeError if selectedToken is falsey', function () {
      const { wrapper, instance, propsMethodSpies: { updateGasFeeError } } = shallowRenderSendAmountRow()

      wrapper.setProps({ selectedToken: null })

      assert.equal(updateGasFeeError.callCount, 0)

      instance.validateAmount('someAmount')

      assert.equal(updateGasFeeError.callCount, 0)
    })

  })

  describe('updateAmount', function () {

    it('should call setMaxModeTo', function () {
      const { instance, propsMethodSpies: { setMaxModeTo } } = shallowRenderSendAmountRow()

      assert.equal(setMaxModeTo.callCount, 0)

      instance.updateAmount('someAmount')

      assert.ok(setMaxModeTo.calledOnceWithExactly(false))
    })

    it('should call updateSendAmount', function () {
      const { instance, propsMethodSpies: { updateSendAmount } } = shallowRenderSendAmountRow()

      assert.equal(updateSendAmount.callCount, 0)

      instance.updateAmount('someAmount')

      assert.ok(updateSendAmount.calledOnceWithExactly('someAmount'))
    })

  })

  describe('render', function () {
    it('should render a SendRowWrapper component', function () {
      const { wrapper } = shallowRenderSendAmountRow()

      assert.equal(wrapper.find(SendRowWrapper).length, 1)
    })

    it('should pass the correct props to SendRowWrapper', function () {
      const { wrapper } = shallowRenderSendAmountRow()
      const {
        errorType,
        label,
        showError,
      } = wrapper.find(SendRowWrapper).props()

      assert.equal(errorType, 'amount')
      assert.equal(label, 'amount_t:')
      assert.equal(showError, false)
    })

    it('should render an AmountMaxButton as the first child of the SendRowWrapper', function () {
      const { wrapper } = shallowRenderSendAmountRow()

      assert(wrapper.find(SendRowWrapper).childAt(0).is(AmountMaxButton))
    })

    it('should render a UserPreferencedTokenInput as the second child of the SendRowWrapper', function () {
      const { wrapper } = shallowRenderSendAmountRow()

      assert(wrapper.find(SendRowWrapper).childAt(1).is(UserPreferencedTokenInput))
    })

<<<<<<< HEAD
    it('should render the UserPreferencedTokenInput with the correct props', async () => {
=======
    it('should render the UserPreferencedTokenInput with the correct props', function () {
      const { wrapper, instanceSpies: { updateGas, updateAmount, validateAmount } } = shallowRenderSendAmountRow()
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
      const {
        onChange,
        error,
        value,
      } = wrapper.find(SendRowWrapper).childAt(1).props()

      assert.equal(error, false)
      assert.equal(value, 'mockAmount')
<<<<<<< HEAD
      assert.equal(SendAmountRow.prototype.updateGas.callCount, 0)
      assert.equal(SendAmountRow.prototype.updateAmount.callCount, 0)
      assert.equal(SendAmountRow.prototype.validateAmount.callCount, 0)
      onChange('mockNewAmount')
      await timeout(501)
      assert.deepEqual(
        SendAmountRow.prototype.updateGas.getCall(0).args,
        ['mockNewAmount']
      )
      assert.equal(SendAmountRow.prototype.updateAmount.callCount, 1)
      assert.deepEqual(
        SendAmountRow.prototype.updateAmount.getCall(0).args,
        ['mockNewAmount']
      )
      assert.equal(SendAmountRow.prototype.validateAmount.callCount, 1)
      assert.deepEqual(
        SendAmountRow.prototype.validateAmount.getCall(0).args,
        ['mockNewAmount']
      )
=======
      assert.equal(updateGas.callCount, 0)
      assert.equal(updateAmount.callCount, 0)
      assert.equal(validateAmount.callCount, 0)

      onChange('mockNewAmount')

      assert.ok(updateGas.calledOnceWithExactly('mockNewAmount'))
      assert.ok(updateAmount.calledOnceWithExactly('mockNewAmount'))
      assert.ok(validateAmount.calledOnceWithExactly('mockNewAmount'))
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    })
  })
})

function shallowRenderSendAmountRow () {
  const setMaxModeTo = sinon.spy()
  const updateGasFeeError = sinon.spy()
  const updateSendAmount = sinon.spy()
  const updateSendAmountError = sinon.spy()
  const wrapper = shallow((
    <SendAmountRow
      amount="mockAmount"
      amountConversionRate="mockAmountConversionRate"
      balance="mockBalance"
      conversionRate={7}
      convertedCurrency="mockConvertedCurrency"
      gasTotal="mockGasTotal"
      inError={false}
      primaryCurrency="mockPrimaryCurrency"
      selectedToken={ { address: 'mockTokenAddress' } }
      setMaxModeTo={setMaxModeTo}
      tokenBalance="mockTokenBalance"
      updateGasFeeError={updateGasFeeError}
      updateSendAmount={updateSendAmount}
      updateSendAmountError={updateSendAmountError}
      updateGas={() => {}}
    />
  ), { context: { t: (str) => str + '_t' } })
  const instance = wrapper.instance()
  const updateAmount = sinon.spy(instance, 'updateAmount')
  const updateGas = sinon.spy(instance, 'updateGas')
  const validateAmount = sinon.spy(instance, 'validateAmount')

  return {
    instance,
    wrapper,
    propsMethodSpies: {
      setMaxModeTo,
      updateGasFeeError,
      updateSendAmount,
      updateSendAmountError,
    },
    instanceSpies: {
      updateAmount,
      updateGas,
      validateAmount,
    },
  }
}
