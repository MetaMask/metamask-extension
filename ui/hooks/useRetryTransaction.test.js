import * as reactRedux from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import sinon from 'sinon';
import transactions from '../../test/data/transaction-data.json';
import { getIsMainnet } from '../selectors';
import * as methodDataHook from './useMethodData';
import * as metricEventHook from './useMetricEvent';
import { useRetryTransaction } from './useRetryTransaction';

jest.mock('./useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

describe('useRetryTransaction', () => {
  describe('when transaction meets retry enabled criteria', () => {
    let useSelector;
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
      useSelector = sinon.stub(reactRedux, 'useSelector');
      useSelector.callsFake((selector) => {
        if (selector === getIsMainnet) {
          return true;
        }
        return undefined;
      });
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
      const { retryTransaction } = result.current;
      act(() => {
        retryTransaction(event);
      });
      expect(trackEvent.calledOnce).toStrictEqual(true);
    });

    it('retryTransaction function should show retry popover', async () => {
      const { result } = renderHook(() =>
        useRetryTransaction(retryEnabledTransaction, true),
      );
      const { retryTransaction } = result.current;
      await act(async () => {
        await retryTransaction(event);
      });
      expect(result.current.showRetryEditGasPopover).toStrictEqual(true);
    });
  });
});
