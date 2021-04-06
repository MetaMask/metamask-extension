import assert from 'assert';
import * as reactRedux from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import sinon from 'sinon';
import transactions from '../../../test/data/transaction-data.json';
import { showSidebar } from '../store/actions';
import * as methodDataHook from './useMethodData';
import * as metricEventHook from './useMetricEvent';
import { useRetryTransaction } from './useRetryTransaction';

describe('useRetryTransaction', function () {
  describe('when transaction meets retry enabled criteria', function () {
    const dispatch = sinon.spy(() => Promise.resolve({ blockTime: 0 }));
    const trackEvent = sinon.spy();
    const event = {
      preventDefault: () => undefined,
      stopPropagation: () => undefined,
    };

    before(function () {
      sinon.stub(reactRedux, 'useDispatch').returns(dispatch);
      sinon.stub(methodDataHook, 'useMethodData').returns({});
      sinon.stub(metricEventHook, 'useMetricEvent').returns(trackEvent);
    });

    afterEach(function () {
      dispatch.resetHistory();
      trackEvent.resetHistory();
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

    it('retryTransaction function should track metrics', function () {
      const { result } = renderHook(() =>
        useRetryTransaction(retryEnabledTransaction, true),
      );
      const retry = result.current;
      retry(event);
      assert.strictEqual(trackEvent.calledOnce, true);
    });

    it('retryTransaction function should show retry sidebar', async function () {
      const { result } = renderHook(() =>
        useRetryTransaction(retryEnabledTransaction, true),
      );
      const retry = result.current;
      await retry(event);
      assert.strictEqual(
        dispatch.calledWith(
          showSidebar({
            transitionName: 'sidebar-left',
            type: 'customize-gas',
            props: { transaction: retryEnabledTransaction.initialTransaction },
          }),
        ),
        true,
      );
    });

    it('should handle cancelled or multiple speedup transactions', async function () {
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
      assert.strictEqual(
        dispatch.calledWith(
          showSidebar({
            transitionName: 'sidebar-left',
            type: 'customize-gas',
            props: { transaction: cancelledTransaction.primaryTransaction },
          }),
        ),
        true,
      );
    });

    after(function () {
      sinon.restore();
    });
  });
});
