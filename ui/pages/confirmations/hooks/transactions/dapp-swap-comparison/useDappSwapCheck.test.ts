import { TransactionType } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapCheck } from './useDappSwapCheck';

async function runHook(mockConfirmation?: Confirmation) {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapCheck,
    getMockConfirmStateForTransaction(
      mockConfirmation ?? (mockSwapConfirmation as Confirmation),
    ),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapCheck', () => {
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
