import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapComparisonLatencyMetrics } from './useDappSwapComparisonLatencyMetrics';

jest.useFakeTimers();

async function runHook() {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapComparisonLatencyMetrics,
    getMockConfirmStateForTransaction(mockSwapConfirmation as Confirmation),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapComparisonLatencyMetrics', () => {
  it('return required parameters', async () => {
    const result = await runHook();
    expect(result.quoteRequestLatency).toEqual('N/A');
    expect(result.quoteResponseLatency).toEqual('N/A');
    expect(result.requestDetectionLatency).toEqual('N/A');
    expect(result.swapComparisonLatency).toEqual('N/A');
    expect(result.updateRequestDetectionLatency).toBeDefined();
    expect(result.updateQuoteRequestLatency).toBeDefined();
    expect(result.updateQuoteResponseLatency).toBeDefined();
    expect(result.updateSwapComparisonLatency).toBeDefined();
  });
});
