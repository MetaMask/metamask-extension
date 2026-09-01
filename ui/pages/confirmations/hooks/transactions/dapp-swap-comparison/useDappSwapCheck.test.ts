import { TransactionType } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapCheck } from './useDappSwapCheck';

async function runHook(
  mockConfirmation?: Confirmation,
  dappSwapMetrics: { enabled?: boolean; origins?: string[] } = {},
) {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapCheck,
    getMockConfirmStateForTransaction(
      mockConfirmation ?? (mockSwapConfirmation as Confirmation),
      {
        metamask: {
          remoteFeatureFlags: {
            dappSwapMetrics: {
              enabled: true,
              origins: ['https://metamask.github.io'],
              ...dappSwapMetrics,
            },
          },
        },
      },
    ),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapCheck', () => {
  it('return true if dappSwapMetrics is enabled and origin is in the list of allowed origins and type is contract interaction or batch', async () => {
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

  it('return false if dappSwapMetrics is not enabled', async () => {
    const mockConfirmation = {
      ...mockSwapConfirmation,
      origin: 'https://metamask.github.io',
      type: TransactionType.contractInteraction,
    };
    const { isSwapToBeCompared } = await runHook(
      mockConfirmation as Confirmation,
      { enabled: false },
    );
    expect(isSwapToBeCompared).toBe(false);
  });

  it('return false if origin is not in the list of allowed origins', async () => {
    const mockConfirmation = {
      ...mockSwapConfirmation,
      origin: 'https://test.com',
      type: TransactionType.contractInteraction,
    };
    const { isSwapToBeCompared } = await runHook(
      mockConfirmation as Confirmation,
      { origins: ['https://metamask.github.io'] },
    );
    expect(isSwapToBeCompared).toBe(false);
  });

  it('return false if type is not contract interaction or batch', async () => {
    const mockConfirmation = {
      ...mockSwapConfirmation,
      origin: 'https://metamask.github.io',
      type: TransactionType.bridge,
    };
    const { isSwapToBeCompared } = await runHook(
      mockConfirmation as Confirmation,
    );
    expect(isSwapToBeCompared).toBe(false);
  });
});
