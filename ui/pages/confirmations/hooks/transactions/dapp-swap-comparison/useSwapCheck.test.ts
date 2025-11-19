import { TransactionType } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { useSwapCheck } from './useSwapCheck';

async function runHook(mockConfirmation?: Confirmation) {
  const response = renderHookWithConfirmContextProvider(
    useSwapCheck,
    getMockConfirmStateForTransaction(
      mockConfirmation ?? (mockSwapConfirmation as Confirmation),
    ),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useSwapCheck', () => {
  it('return isQuotedSwap false for dapp suggested swap', async () => {
    const { isQuotedSwap } = await runHook();
    expect(isQuotedSwap).toBe(false);
  });

  it('return isQuotedSwap true for quoted swap', async () => {
    const mockConfirmation = {
      ...mockSwapConfirmation,
      txParamsOriginal: mockSwapConfirmation.txParams,
      txParams: {
        ...mockSwapConfirmation.txParams,
        data: '0x1234567890',
      },
    };
    const { isQuotedSwap } = await runHook(mockConfirmation as Confirmation);
    expect(isQuotedSwap).toBe(true);
  });

  it('return correct value for isSwapToBeCompared', async () => {
    const mockConfirmation = {
      ...mockSwapConfirmation,
      origin: 'https://metamask.github.io',
      type: TransactionType.contractInteraction,
    };
    const { isSwapToBeCompared } = await runHook(
      mockConfirmation as Confirmation,
    );
    expect(isSwapToBeCompared).toBe(true);
  });
});
