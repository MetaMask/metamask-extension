import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
import { mount } from 'enzyme'
import ConfirmTransactionBase, { getMethodName } from '../confirm-transaction-base.component'

describe('ConfirmTransactionBase Component', () => {
  let wrapper

  const txData = {
    id: 1,
    status: 'unapproved',
    txParams: {
      from: '0xAddress',
      to: '0xAddress',
      gas: '0x5208', // 21000
      gasPrice: '0x3b9aca00', // 1000000000 wei
      value: '0x1bc16d674ec80000',
    },
  }

  const state = {
    metamask: {
      network: 'test',
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      provider: {
        type: 'test',
      },
    },
  }

  const middlewares = [thunk]
  const mockStore = configureMockStore(middlewares)
  const store = mockStore(state)


  const props = {
    cancelAllTransactions: sinon.spy(),
    cancelTransaction: sinon.stub(),
    clearConfirmTransaction: sinon.spy(),
    clearSend: sinon.spy(),
    onEdit: sinon.spy(),
    onSubmit: sinon.stub(),
    sendTransaction: sinon.stub(),
    setMetaMetricsSendCount: sinon.stub(),
    showCustomizeGasModal: sinon.spy(),
    showRejectTransactionsConfirmationModal: sinon.spy(),
    showTransactionConfirmedModal: sinon.spy(),
    updateGasAndCalculate: sinon.spy(),
    hideDate: true,
    fromAddress: '0xAddress',
    fromName: 'Account 1',
    toAddress: '0xAddress',
    toName: 'Account 1',
    customGas: {
      gasLimit: 21000,
    },
    currentNetworkUnapprovedTxs: {
      1: {
        id: 1,
        status: 'unapproved',
        txParams: {
          from: '0xAddress',
          to: '0xAddress',
          gas: '0x5208',
          gasPrice: '0x1',
          value: '0x1bc16d674ec80000',
        },
      },
      2: {
        id: 2,
        status: 'unapproved',
        txParams: {
          from: '0xAddress',
          to: '0xAddress',
          gas: '0x5208',
          gasPrice: '0x1',
          value: '0x1bc16d674ec80000',
        },
      },
    },
    txData,
    methodData: {},
  }

  describe('Render Confirm Transaction', () => {

    beforeEach(() => {
      wrapper = mount(
        <ConfirmTransactionBase {...props} store={store} />, {
          context: {
            t: str => str,
            tOrKey: str => str,
            metricsEvent: () => {},
            store,
          },
          childContextTypes: {
            t: React.PropTypes.func,
            tOrKey: React.PropTypes.func,
            metricsEvent: React.PropTypes.func,
            store: React.PropTypes.object,
          },
        }
      )
    })

    it('shows customize gas modal when edit gas is clicked', () => {
      const editGas = wrapper.find('.confirm-detail-row__header-text--edit')
      editGas.simulate('click')
      assert(props.showCustomizeGasModal.calledOnce)
    })

    it('calls onEditGas when onEditGas prop is present', () => {
      wrapper.setProps({ onEditGas: sinon.spy() })
      const edit = wrapper.find('.confirm-detail-row__header-text--edit')
      edit.simulate('click')
      assert(wrapper.prop('onEditGas').calledOnce)
    })

    it('shows error message when computed value of a transaction is less than balance', () => {
      assert.equal(wrapper.find('.error-message').length, 0)
      wrapper = wrapper.setProps({ balance: '0x6f05b59d3b20000' })
      assert.equal(wrapper.find('.error-message').length, 1)
      assert.deepEqual(wrapper.instance().getErrorKey(), { valid: false, errorKey: 'insufficientFunds' })

    })

    it('sets transactionError when simulation fails with no message', () => {
      txData.simulationFails = {}
      wrapper.setProps({ txData })
      assert.deepEqual(wrapper.instance().getErrorKey(), { valid: true, errorKey: 'transactionError' })
    })

    it('sets message when simulation fails with message', () => {
      txData.simulationFails = {errorKey: 'error'}
      wrapper.setProps({ txData })
      assert.deepEqual(wrapper.instance().getErrorKey(), { valid: true, errorKey: 'error' })
    })

    it('reject', async () => {
      const handleCancelSpy = sinon.spy(ConfirmTransactionBase.prototype, 'handleCancel')
      await props.cancelTransaction.resolves()

      const reject = wrapper.find({ type: 'default' })
      reject.simulate('click')
      assert(handleCancelSpy.calledOnce)
      assert(props.cancelTransaction.calledOnce)
    })

    it('confirm', async () => {
      const handleSubmitSpy = sinon.spy(ConfirmTransactionBase.prototype, 'handleSubmit')
      await props.setMetaMetricsSendCount.resolves()
      wrapper.update()

      const confirm = wrapper.find({ type: 'confirm' })
      confirm.simulate('click')
      assert(handleSubmitSpy.calledOnce)
      assert(await props.setMetaMetricsSendCount.calledOnce)
    })

  })

  describe('getMethodName', () => {
    it('should get correct method names', () => {
      assert.equal(getMethodName(undefined), '')
      assert.equal(getMethodName({}), '')
      assert.equal(getMethodName('confirm'), 'confirm')
      assert.equal(getMethodName('balanceOf'), 'balance Of')
      assert.equal(getMethodName('ethToTokenSwapInput'), 'eth To Token Swap Input')
    })
  })
})
