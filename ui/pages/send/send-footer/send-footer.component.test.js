import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { renderWithProvider } from '../../../../test/jest';
import SendFooter from './send-footer.component';

describe('SendFooter Component', () => {
  let wrapper;

  const propsMethodSpies = {
    addToAddressBookIfNew: sinon.spy(),
    cancelTx: sinon.spy(),
    resetSendState: sinon.spy(),
    sign: sinon.spy(),
    update: sinon.spy(),
    mostRecentOverviewPage: '/',
  };
  const historySpies = {
    push: sinon.spy(),
  };
  const MOCK_EVENT = { preventDefault: () => undefined };

  const renderShallow = (props) => {
    return shallow(
      <SendFooter
        addToAddressBookIfNew={propsMethodSpies.addToAddressBookIfNew}
        resetSendState={propsMethodSpies.resetSendState}
        cancelTx={propsMethodSpies.cancelTx}
        disabled
        draftTransactionID="ID"
        history={historySpies}
        sign={propsMethodSpies.sign}
        to="mockTo"
        toAccounts={['mockAccount']}
        sendErrors={{}}
        sendStage="DRAFT"
        gasEstimateType="BASIC"
        mostRecentOverviewPage="mostRecentOverviewPage"
        {...props}
      />,
      { context: { t: (str) => str, trackEvent: () => ({}) } },
    );
  };

  beforeAll(() => {
    sinon.spy(SendFooter.prototype, 'onCancel');
    sinon.spy(SendFooter.prototype, 'onSubmit');
  });

  beforeEach(() => {
    wrapper = renderShallow();
  });

  afterEach(() => {
    propsMethodSpies.resetSendState.resetHistory();
    propsMethodSpies.cancelTx.resetHistory();
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

    it('should call cancelTx', () => {
      expect(propsMethodSpies.cancelTx.callCount).toStrictEqual(0);
      wrapper.instance().onCancel();
      expect(propsMethodSpies.cancelTx.callCount).toStrictEqual(1);
      expect(propsMethodSpies.cancelTx.getCall(0).args[0]?.id).toStrictEqual(
        'ID',
      );
    });

    it('should call history.push', () => {
      expect(historySpies.push.callCount).toStrictEqual(0);
      wrapper.instance().onCancel();
      expect(historySpies.push.callCount).toStrictEqual(1);
      expect(historySpies.push.getCall(0).args[0]).toStrictEqual(
        'mostRecentOverviewPage',
      );
    });

    it('should call history.push with DEFAULT_ROUTE in  edit stage', () => {
      wrapper = renderShallow({ sendStage: 'EDIT' });
      expect(historySpies.push.callCount).toStrictEqual(0);
      wrapper.instance().onCancel();
      expect(historySpies.push.callCount).toStrictEqual(1);
      expect(historySpies.push.getCall(0).args[0]).toStrictEqual(DEFAULT_ROUTE);
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
          cancelTx={propsMethodSpies.cancelTx}
          disabled
          draftTransactionID="ID"
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
        { context: { t: (str) => str, trackEvent: () => ({}) } },
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

  describe('Cancel Button', () => {
    const renderFooter = (props) =>
      renderWithProvider(
        <SendFooter
          disabled
          mostRecentOverviewPage="mostRecentOverviewPage"
          draftTransactionID="ID"
          sendErrors={{}}
          sendStage="DRAFT"
          {...props}
        />,
      );

    it('has a cancel button in footer', () => {
      const { getByText } = renderFooter();
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('has label changed to Reject in editing stage', () => {
      const { getByText } = renderFooter({ sendStage: 'EDIT' });
      expect(getByText('Reject')).toBeTruthy();
    });
  });
});
