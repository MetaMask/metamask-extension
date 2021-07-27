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
    resetSendState: sinon.spy(),
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
        resetSendState={propsMethodSpies.resetSendState}
        disabled
        history={historySpies}
        sign={propsMethodSpies.sign}
        to="mockTo"
        toAccounts={['mockAccount']}
        sendErrors={{}}
        gasEstimateType="BASIC"
        mostRecentOverviewPage="mostRecentOverviewPage"
      />,
      { context: { t: (str) => str, metricsEvent: () => ({}) } },
    );
  });

  afterEach(() => {
    propsMethodSpies.resetSendState.resetHistory();
    propsMethodSpies.addToAddressBookIfNew.resetHistory();
    propsMethodSpies.resetSendState.resetHistory();
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
    it('should call resetSendState', () => {
      expect(propsMethodSpies.resetSendState.callCount).toStrictEqual(0);
      wrapper.instance().onCancel();
      expect(propsMethodSpies.resetSendState.callCount).toStrictEqual(1);
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

    it('should call props.sign whe submitting', async () => {
      await wrapper.instance().onSubmit(MOCK_EVENT);
      expect(propsMethodSpies.sign.calledOnce).toStrictEqual(true);
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
      wrapper = shallow(
        <SendFooter
          addToAddressBookIfNew={propsMethodSpies.addToAddressBookIfNew}
          amount="mockAmount"
          resetSendState={propsMethodSpies.resetSendState}
          disabled
          editingTransactionId="mockEditingTransactionId"
          errors={{}}
          from={{ address: 'mockAddress', balance: 'mockBalance' }}
          gasLimit="mockGasLimit"
          gasPrice="mockGasPrice"
          gasTotal="mockGasTotal"
          history={historySpies}
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
