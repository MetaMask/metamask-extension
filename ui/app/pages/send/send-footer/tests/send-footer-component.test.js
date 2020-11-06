import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes'
import SendFooter from '../send-footer.component'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'

describe('SendFooter Component', function () {
  let wrapper

  const propsMethodSpies = {
    addToAddressBookIfNew: sinon.spy(),
    clearSend: sinon.spy(),
    sign: sinon.spy(),
    update: sinon.spy(),
  }
  const historySpies = {
    push: sinon.spy(),
  }
  const MOCK_EVENT = { preventDefault: () => undefined }

  before(function () {
    sinon.spy(SendFooter.prototype, 'onCancel')
    sinon.spy(SendFooter.prototype, 'onSubmit')
  })

  beforeEach(function () {
    wrapper = shallow(
      <SendFooter
        addToAddressBookIfNew={propsMethodSpies.addToAddressBookIfNew}
        amount="mockAmount"
        clearSend={propsMethodSpies.clearSend}
        disabled
        editingTransactionId="mockEditingTransactionId"
        errors={{}}
        from={{ address: 'mockAddress', balance: 'mockBalance' }}
        gasLimit="mockGasLimit"
        gasPrice="mockGasPrice"
        gasTotal="mockGasTotal"
        history={historySpies}
        inError={false}
        sendToken={{ mockProp: 'mockSendTokenProp' }}
        sign={propsMethodSpies.sign}
        to="mockTo"
        toAccounts={['mockAccount']}
        tokenBalance="mockTokenBalance"
        unapprovedTxs={{}}
        update={propsMethodSpies.update}
        sendErrors={{}}
        mostRecentOverviewPage="mostRecentOverviewPage"
      />,
      { context: { t: (str) => str, metricsEvent: () => ({}) } },
    )
  })

  afterEach(function () {
    propsMethodSpies.clearSend.resetHistory()
    propsMethodSpies.addToAddressBookIfNew.resetHistory()
    propsMethodSpies.clearSend.resetHistory()
    propsMethodSpies.sign.resetHistory()
    propsMethodSpies.update.resetHistory()
    historySpies.push.resetHistory()
    SendFooter.prototype.onCancel.resetHistory()
    SendFooter.prototype.onSubmit.resetHistory()
  })

  after(function () {
    sinon.restore()
  })

  describe('onCancel', function () {
    it('should call clearSend', function () {
      assert.equal(propsMethodSpies.clearSend.callCount, 0)
      wrapper.instance().onCancel()
      assert.equal(propsMethodSpies.clearSend.callCount, 1)
    })

    it('should call history.push', function () {
      assert.equal(historySpies.push.callCount, 0)
      wrapper.instance().onCancel()
      assert.equal(historySpies.push.callCount, 1)
      assert.equal(
        historySpies.push.getCall(0).args[0],
        'mostRecentOverviewPage',
      )
    })
  })

  describe('formShouldBeDisabled()', function () {
    const config = {
      'should return true if inError is truthy': {
        inError: true,
        expectedResult: true,
        gasIsLoading: false,
      },
      'should return true if gasTotal is falsy': {
        inError: false,
        gasTotal: '',
        expectedResult: true,
        gasIsLoading: false,
      },
      'should return true if to is truthy': {
        to: '0xsomevalidAddress',
        inError: false,
        gasTotal: '',
        expectedResult: true,
        gasIsLoading: false,
      },
      'should return true if sendToken is truthy and tokenBalance is falsy': {
        sendToken: { mockProp: 'mockSendTokenProp' },
        tokenBalance: '',
        expectedResult: true,
        gasIsLoading: false,
      },
      'should return true if gasIsLoading is truthy but all other params are falsy': {
        inError: false,
        gasTotal: '',
        sendToken: null,
        tokenBalance: '',
        expectedResult: true,
        gasIsLoading: true,
      },
      'should return false if inError is false and all other params are truthy': {
        inError: false,
        gasTotal: '0x123',
        sendToken: { mockProp: 'mockSendTokenProp' },
        tokenBalance: '123',
        expectedResult: false,
        gasIsLoading: false,
      },
    }
    Object.entries(config).forEach(([description, obj]) => {
      it(description, function () {
        wrapper.setProps(obj)
        assert.equal(
          wrapper.instance().formShouldBeDisabled(),
          obj.expectedResult,
        )
      })
    })
  })

  describe('onSubmit', function () {
    it('should call addToAddressBookIfNew with the correct params', function () {
      wrapper.instance().onSubmit(MOCK_EVENT)
      assert(propsMethodSpies.addToAddressBookIfNew.calledOnce)
      assert.deepEqual(propsMethodSpies.addToAddressBookIfNew.getCall(0).args, [
        'mockTo',
        ['mockAccount'],
      ])
    })

    it('should call props.update if editingTransactionId is truthy', async function () {
      await wrapper.instance().onSubmit(MOCK_EVENT)
      assert(propsMethodSpies.update.calledOnce)
      assert.deepEqual(propsMethodSpies.update.getCall(0).args[0], {
        data: undefined,
        amount: 'mockAmount',
        editingTransactionId: 'mockEditingTransactionId',
        from: 'mockAddress',
        gas: 'mockGasLimit',
        gasPrice: 'mockGasPrice',
        sendToken: { mockProp: 'mockSendTokenProp' },
        to: 'mockTo',
        unapprovedTxs: {},
      })
    })

    it('should not call props.sign if editingTransactionId is truthy', function () {
      assert.equal(propsMethodSpies.sign.callCount, 0)
    })

    it('should call props.sign if editingTransactionId is falsy', async function () {
      wrapper.setProps({ editingTransactionId: null })
      await wrapper.instance().onSubmit(MOCK_EVENT)
      assert(propsMethodSpies.sign.calledOnce)
      assert.deepEqual(propsMethodSpies.sign.getCall(0).args[0], {
        data: undefined,
        amount: 'mockAmount',
        from: 'mockAddress',
        gas: 'mockGasLimit',
        gasPrice: 'mockGasPrice',
        sendToken: { mockProp: 'mockSendTokenProp' },
        to: 'mockTo',
      })
    })

    it('should not call props.update if editingTransactionId is falsy', function () {
      assert.equal(propsMethodSpies.update.callCount, 0)
    })

    it('should call history.push', async function () {
      await wrapper.instance().onSubmit(MOCK_EVENT)
      assert.equal(historySpies.push.callCount, 1)
      assert.equal(
        historySpies.push.getCall(0).args[0],
        CONFIRM_TRANSACTION_ROUTE,
      )
    })
  })

  describe('render', function () {
    beforeEach(function () {
      sinon.stub(SendFooter.prototype, 'formShouldBeDisabled').returns(true)
      wrapper = shallow(
        <SendFooter
          addToAddressBookIfNew={propsMethodSpies.addToAddressBookIfNew}
          amount="mockAmount"
          clearSend={propsMethodSpies.clearSend}
          disabled
          editingTransactionId="mockEditingTransactionId"
          errors={{}}
          from={{ address: 'mockAddress', balance: 'mockBalance' }}
          gasLimit="mockGasLimit"
          gasPrice="mockGasPrice"
          gasTotal="mockGasTotal"
          history={historySpies}
          inError={false}
          sendToken={{ mockProp: 'mockSendTokenProp' }}
          sign={propsMethodSpies.sign}
          to="mockTo"
          toAccounts={['mockAccount']}
          tokenBalance="mockTokenBalance"
          unapprovedTxs={{}}
          update={propsMethodSpies.update}
        />,
        { context: { t: (str) => str, metricsEvent: () => ({}) } },
      )
    })

    afterEach(function () {
      SendFooter.prototype.formShouldBeDisabled.restore()
    })

    it('should render a PageContainerFooter component', function () {
      assert.equal(wrapper.find(PageContainerFooter).length, 1)
    })

    it('should pass the correct props to PageContainerFooter', function () {
      const { onCancel, onSubmit, disabled } = wrapper
        .find(PageContainerFooter)
        .props()
      assert.equal(disabled, true)

      assert.equal(SendFooter.prototype.onSubmit.callCount, 0)
      onSubmit(MOCK_EVENT)
      assert.equal(SendFooter.prototype.onSubmit.callCount, 1)

      assert.equal(SendFooter.prototype.onCancel.callCount, 0)
      onCancel()
      assert.equal(SendFooter.prototype.onCancel.callCount, 1)
    })
  })
})
