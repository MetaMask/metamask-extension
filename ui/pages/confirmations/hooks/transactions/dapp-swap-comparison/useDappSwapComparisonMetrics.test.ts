import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapComparisonMetrics } from './useDappSwapComparisonMetrics';

const mockUpdateTransactionEventFragment = jest.fn();
jest.mock('../../../hooks/useTransactionEventFragment', () => ({
  useTransactionEventFragment: () => ({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  }),
}));

async function runHook() {
  const response = renderHookWithConfirmContextProvider(
    () => useDappSwapComparisonMetrics(),
    getMockConfirmStateForTransaction(mockSwapConfirmation as Confirmation),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapComparisonMetrics', () => {
  it('returns required metrics functions', async () => {
    const result = await runHook();
    expect(result.captureSwapSubmit).toBeDefined();
    expect(result.captureDappSwapComparisonDisplayProperties).toBeDefined();
    expect(result.captureDappSwapComparisonLoading).toBeDefined();
    expect(result.captureDappSwapComparisonMetricsProperties).toBeDefined();
    expect(result.captureDappSwapComparisonMetricsProperties).toBeDefined();
  });
});
