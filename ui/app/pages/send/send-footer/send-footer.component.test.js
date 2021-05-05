import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import SendFooter from './send-footer.component';

describe('SendFooter Component', () => {
  let wrapper;

  const propsMethodSpies = {
    addToAddressBookIfNew: sinon.spy(),
    clearSend: sinon.spy(),
    sign: sinon.spy(),
    update: sinon.spy(),
    mostRecentOverviewPage: '/',
  };
  const historySpies = {
    push: sinon.spy(),
  };
  const MOCK_EVENT = { preventDefault: () => undefined };

  beforeAll(() => {
    sinon.spy(SendFooter.prototype, 'onCancel');
    sinon.spy(SendFooter.prototype, 'onSubmit');
  });

  beforeEach(() => {
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
    );
  });

  afterEach(() => {
    propsMethodSpies.clearSend.resetHistory();
    propsMethodSpies.addToAddressBookIfNew.resetHistory();
    propsMethodSpies.clearSend.resetHistory();
    propsMethodSpies.sign.resetHistory();
    propsMethodSpies.update.resetHistory();
    historySpies.push.resetHistory();
    SendFooter.prototype.onCancel.resetHistory();
    SendFooter.prototype.onSubmit.resetHistory();
  });

  afterAll(() => {
    sinon.restore();
  });

  describe('onCancel', () => {
    it('should call clearSend', () => {
      expect(propsMethodSpies.clearSend.callCount).toStrictEqual(0);
      wrapper.instance().onCancel();
      expect(propsMethodSpies.clearSend.callCount).toStrictEqual(1);
    });

    it('should call history.push', () => {
      expect(historySpies.push.callCount).toStrictEqual(0);
      wrapper.instance().onCancel();
      expect(historySpies.push.callCount).toStrictEqual(1);
      expect(historySpies.push.getCall(0).args[0]).toStrictEqual(
        'mostRecentOverviewPage',
      );
    });
  });

  describe('formShouldBeDisabled()', () => {
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
    };
    Object.entries(config).forEach(([description, obj]) => {
      it(`${description}`, () => {
        wrapper.setProps(obj);
        expect(wrapper.instance().formShouldBeDisabled()).toStrictEqual(
          obj.expectedResult,
        );
      });
    });
  });

  describe('onSubmit', () => {
    it('should call addToAddressBookIfNew with the correct params', () => {
      wrapper.instance().onSubmit(MOCK_EVENT);
      expect(propsMethodSpies.addToAddressBookIfNew.calledOnce).toStrictEqual(
        true,
      );
      expect(
        propsMethodSpies.addToAddressBookIfNew.getCall(0).args,
      ).toStrictEqual(['mockTo', ['mockAccount']]);
    });

    it('should call props.update if editingTransactionId is truthy', async () => {
      await wrapper.instance().onSubmit(MOCK_EVENT);
      expect(propsMethodSpies.update.calledOnce).toStrictEqual(true);
      expect(propsMethodSpies.update.getCall(0).args[0]).toStrictEqual({
        data: undefined,
        amount: 'mockAmount',
        editingTransactionId: 'mockEditingTransactionId',
        from: 'mockAddress',
        gas: 'mockGasLimit',
        gasPrice: 'mockGasPrice',
        sendToken: { mockProp: 'mockSendTokenProp' },
        to: 'mockTo',
        unapprovedTxs: {},
      });
    });

    it('should not call props.sign if editingTransactionId is truthy', () => {
      expect(propsMethodSpies.sign.callCount).toStrictEqual(0);
    });

    it('should call props.sign if editingTransactionId is falsy', async () => {
      wrapper.setProps({ editingTransactionId: null });
      await wrapper.instance().onSubmit(MOCK_EVENT);
      expect(propsMethodSpies.sign.calledOnce).toStrictEqual(true);
      expect(propsMethodSpies.sign.getCall(0).args[0]).toStrictEqual({
        data: undefined,
        amount: 'mockAmount',
        from: 'mockAddress',
        gas: 'mockGasLimit',
        gasPrice: 'mockGasPrice',
        sendToken: { mockProp: 'mockSendTokenProp' },
        to: 'mockTo',
      });
    });

    it('should not call props.update if editingTransactionId is falsy', () => {
      expect(propsMethodSpies.update.callCount).toStrictEqual(0);
    });

    it('should call history.push', async () => {
      await wrapper.instance().onSubmit(MOCK_EVENT);
      expect(historySpies.push.callCount).toStrictEqual(1);
      expect(historySpies.push.getCall(0).args[0]).toStrictEqual(
        CONFIRM_TRANSACTION_ROUTE,
      );
    });
  });

  describe('render', () => {
    beforeEach(() => {
      sinon.stub(SendFooter.prototype, 'formShouldBeDisabled').returns(true);
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
          mostRecentOverviewPage="mostRecentOverviewPage"
        />,
        { context: { t: (str) => str, metricsEvent: () => ({}) } },
      );
    });

    afterEach(() => {
      SendFooter.prototype.formShouldBeDisabled.restore();
    });

    it('should render a PageContainerFooter component', () => {
      expect(wrapper.find(PageContainerFooter)).toHaveLength(1);
    });

    it('should pass the correct props to PageContainerFooter', () => {
      const { onCancel, onSubmit, disabled } = wrapper
        .find(PageContainerFooter)
        .props();
      expect(disabled).toStrictEqual(true);

      expect(SendFooter.prototype.onSubmit.callCount).toStrictEqual(0);
      onSubmit(MOCK_EVENT);
      expect(SendFooter.prototype.onSubmit.callCount).toStrictEqual(1);

      expect(SendFooter.prototype.onCancel.callCount).toStrictEqual(0);
      onCancel();
      expect(SendFooter.prototype.onCancel.callCount).toStrictEqual(1);
    });
  });
});
