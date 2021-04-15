import * as reactRedux from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import transactions from '../../../test/data/transaction-data.json';
import { showSidebar } from '../store/actions';
import * as methodDataHook from './useMethodData';
import * as metricEventHook from './useMetricEvent';
import { useRetryTransaction } from './useRetryTransaction';

describe('useRetryTransaction', () => {
  describe('when transaction meets retry enabled criteria', () => {
    const dispatch = sinon.spy(() => Promise.resolve({ blockTime: 0 }));
    const trackEvent = sinon.spy();
    const event = {
      preventDefault: () => undefined,
      stopPropagation: () => undefined,
    };

    beforeAll(() => {
      sinon.stub(reactRedux, 'useDispatch').returns(dispatch);
      sinon.stub(methodDataHook, 'useMethodData').returns({});
      sinon.stub(metricEventHook, 'useMetricEvent').returns(trackEvent);
    });

    afterEach(() => {
      dispatch.resetHistory();
      trackEvent.resetHistory();
    });

    afterAll(() => {
      sinon.restore();
    });

    const retryEnabledTransaction = {
      ...transactions[0],
      transactions: [
        {
          submittedTime: new Date() - 5001,
        },
      ],
      hasRetried: false,
    };

    it('retryTransaction function should track metrics', () => {
      const { result } = renderHook(() =>
        useRetryTransaction(retryEnabledTransaction, true),
      );
      const retry = result.current;
      retry(event);
      expect(trackEvent.calledOnce).toStrictEqual(true);
    });

    it('retryTransaction function should show retry sidebar', async () => {
      const { result } = renderHook(() =>
        useRetryTransaction(retryEnabledTransaction, true),
      );
      const retry = result.current;
      await retry(event);
      expect(
        dispatch.calledWith(
          showSidebar({
            transitionName: 'sidebar-left',
            type: 'customize-gas',
            props: { transaction: retryEnabledTransaction.initialTransaction },
          }),
        ),
      ).toStrictEqual(true);
    });

    it('should handle cancelled or multiple speedup transactions', async () => {
      const cancelledTransaction = {
        initialTransaction: {
          ...transactions[0].initialTransaction,
          txParams: {
            ...transactions[0].initialTransaction.txParams,
          },
        },
        primaryTransaction: {
          ...transactions[0].primaryTransaction,
          txParams: {
            from: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
            gas: '0x5308',
            gasPrice: '0x77359400',
            nonce: '0x3',
            to: '0xabca64466f257793eaa52fcfff5066894b76a149',
            value: '0x0',
          },
        },
        transactions: [
          {
            submittedTime: new Date() - 5001,
          },
        ],
        hasRetried: false,
      };

      const { result } = renderHook(() =>
        useRetryTransaction(cancelledTransaction, true),
      );
      const retry = result.current;
      await retry(event);
      expect(
        dispatch.calledWith(
          showSidebar({
            transitionName: 'sidebar-left',
            type: 'customize-gas',
            props: { transaction: cancelledTransaction.primaryTransaction },
          }),
        ),
      ).toStrictEqual(true);
    });
  });
});
