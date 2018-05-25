import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { CONFIRM_TRANSACTION_ROUTE, DEFAULT_ROUTE } from '../../../../routes'
import SendFooter from '../send-footer.component.js'

import PageContainerFooter from '../../../page-container/page-container-footer'

const propsMethodSpies = {
  addToAddressBookIfNew: sinon.spy(),
  clearSend: sinon.spy(),
  sign: sinon.spy(),
  update: sinon.spy(),
}
const historySpies = {
  push: sinon.spy(),
}
const MOCK_EVENT = { preventDefault: () => {} }

sinon.spy(SendFooter.prototype, 'onCancel')
sinon.spy(SendFooter.prototype, 'onSubmit')

describe('SendFooter Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendFooter
      addToAddressBookIfNew={propsMethodSpies.addToAddressBookIfNew}
      amount={'mockAmount'}
      clearSend={propsMethodSpies.clearSend}
      disabled={true}
      editingTransactionId={'mockEditingTransactionId'}
      errors={{}}
      from={ { address: 'mockAddress', balance: 'mockBalance' } }
      gasLimit={'mockGasLimit'}
      gasPrice={'mockGasPrice'}
      gasTotal={'mockGasTotal'}
      history={historySpies}
      inError={false}
      selectedToken={{ mockProp: 'mockSelectedTokenProp' }}
      sign={propsMethodSpies.sign}
      to={'mockTo'}
      toAccounts={['mockAccount']}
      tokenBalance={'mockTokenBalance'}
      unapprovedTxs={['mockTx']}
      update={propsMethodSpies.update}
    />, { context: { t: str => str } })
  })

  afterEach(() => {
    propsMethodSpies.clearSend.resetHistory()
    propsMethodSpies.addToAddressBookIfNew.resetHistory()
    propsMethodSpies.clearSend.resetHistory()
    propsMethodSpies.sign.resetHistory()
    propsMethodSpies.update.resetHistory()
    historySpies.push.resetHistory()
    SendFooter.prototype.onCancel.resetHistory()
    SendFooter.prototype.onSubmit.resetHistory()
  })

  describe('onCancel', () => {
    it('should call clearSend', () => {
      assert.equal(propsMethodSpies.clearSend.callCount, 0)
      wrapper.instance().onCancel()
      assert.equal(propsMethodSpies.clearSend.callCount, 1)
    })

    it('should call history.push', () => {
      assert.equal(historySpies.push.callCount, 0)
      wrapper.instance().onCancel()
      assert.equal(historySpies.push.callCount, 1)
      assert.equal(historySpies.push.getCall(0).args[0], DEFAULT_ROUTE)
    })
  })


  describe('formShouldBeDisabled()', () => {
    const config = {
      'should return true if inError is truthy': {
        inError: true,
        expectedResult: true,
      },
      'should return true if gasTotal is falsy': {
        inError: false,
        gasTotal: false,
        expectedResult: true,
      },
      'should return true if to is truthy': {
        to: '0xsomevalidAddress',
        inError: false,
        gasTotal: false,
        expectedResult: true,
      },
      'should return true if selectedToken is truthy and tokenBalance is falsy': {
        selectedToken: true,
        tokenBalance: null,
        expectedResult: true,
      },
      'should return false if inError is false and all other params are truthy': {
        inError: false,
        gasTotal: '0x123',
        selectedToken: true,
        tokenBalance: 123,
        expectedResult: false,
      },
    }
    Object.entries(config).map(([description, obj]) => {
      it(description, () => {
        wrapper.setProps(obj)
        assert.equal(wrapper.instance().formShouldBeDisabled(), obj.expectedResult)
      })
    })
  })

  describe('onSubmit', () => {
    it('should call addToAddressBookIfNew with the correct params', () => {
      wrapper.instance().onSubmit(MOCK_EVENT)
      assert(propsMethodSpies.addToAddressBookIfNew.calledOnce)
      assert.deepEqual(
        propsMethodSpies.addToAddressBookIfNew.getCall(0).args,
        ['mockTo', ['mockAccount']]
      )
    })

    it('should call props.update if editingTransactionId is truthy', () => {
      wrapper.instance().onSubmit(MOCK_EVENT)
      assert(propsMethodSpies.update.calledOnce)
      assert.deepEqual(
        propsMethodSpies.update.getCall(0).args[0],
        {
          amount: 'mockAmount',
          editingTransactionId: 'mockEditingTransactionId',
          from: 'mockAddress',
          gas: 'mockGasLimit',
          gasPrice: 'mockGasPrice',
          selectedToken: { mockProp: 'mockSelectedTokenProp' },
          to: 'mockTo',
          unapprovedTxs: ['mockTx'],
        }
      )
    })

    it('should not call props.sign if editingTransactionId is truthy', () => {
      assert.equal(propsMethodSpies.sign.callCount, 0)
    })

    it('should call props.sign if editingTransactionId is falsy', () => {
      wrapper.setProps({ editingTransactionId: null })
      wrapper.instance().onSubmit(MOCK_EVENT)
      assert(propsMethodSpies.sign.calledOnce)
      assert.deepEqual(
        propsMethodSpies.sign.getCall(0).args[0],
        {
          amount: 'mockAmount',
          from: 'mockAddress',
          gas: 'mockGasLimit',
          gasPrice: 'mockGasPrice',
          selectedToken: { mockProp: 'mockSelectedTokenProp' },
          to: 'mockTo',
        }
      )
    })

    it('should not call props.update if editingTransactionId is falsy', () => {
      assert.equal(propsMethodSpies.update.callCount, 0)
    })

    it('should call history.push', () => {
      wrapper.instance().onSubmit(MOCK_EVENT)
      assert.equal(historySpies.push.callCount, 1)
      assert.equal(historySpies.push.getCall(0).args[0], CONFIRM_TRANSACTION_ROUTE)
    })
  })

  describe('render', () => {
    beforeEach(() => {
      sinon.stub(SendFooter.prototype, 'formShouldBeDisabled').returns('formShouldBeDisabledReturn')
      wrapper = shallow(<SendFooter
        addToAddressBookIfNew={propsMethodSpies.addToAddressBookIfNew}
        amount={'mockAmount'}
        clearSend={propsMethodSpies.clearSend}
        disabled={true}
        editingTransactionId={'mockEditingTransactionId'}
        errors={{}}
        from={ { address: 'mockAddress', balance: 'mockBalance' } }
        gasLimit={'mockGasLimit'}
        gasPrice={'mockGasPrice'}
        gasTotal={'mockGasTotal'}
        history={historySpies}
        inError={false}
        selectedToken={{ mockProp: 'mockSelectedTokenProp' }}
        sign={propsMethodSpies.sign}
        to={'mockTo'}
        toAccounts={['mockAccount']}
        tokenBalance={'mockTokenBalance'}
        unapprovedTxs={['mockTx']}
        update={propsMethodSpies.update}
      />, { context: { t: str => str } })
    })

    afterEach(() => {
      SendFooter.prototype.formShouldBeDisabled.restore()
    })

    it('should render a PageContainerFooter component', () => {
      assert.equal(wrapper.find(PageContainerFooter).length, 1)
    })

    it('should pass the correct props to PageContainerFooter', () => {
      const {
        onCancel,
        onSubmit,
        disabled,
      } = wrapper.find(PageContainerFooter).props()
      assert.equal(disabled, 'formShouldBeDisabledReturn')

      assert.equal(SendFooter.prototype.onSubmit.callCount, 0)
      onSubmit(MOCK_EVENT)
      assert.equal(SendFooter.prototype.onSubmit.callCount, 1)

      assert.equal(SendFooter.prototype.onCancel.callCount, 0)
      onCancel()
      assert.equal(SendFooter.prototype.onCancel.callCount, 1)
    })
  })
})
