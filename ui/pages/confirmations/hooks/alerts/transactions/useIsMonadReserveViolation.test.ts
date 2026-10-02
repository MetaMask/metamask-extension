import { TransactionMeta } from '@metamask/transaction-controller';

import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useIsMonadReserveViolation } from './useIsMonadReserveViolation';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: CHAIN_IDS.MONAD,
}) as TransactionMeta;

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useIsMonadReserveViolation,
    state,
  );

  return response.result.current;
}

describe('useIsMonadReserveViolation', () => {
  it('returns false if no confirmation exists', () => {
    expect(runHook(getMockConfirmState())).toBe(false);
  });

  it('returns true when a Monad simulation failure is a reserve balance violation', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
            debug: {},
          },
        }),
      ),
    ).toBe(true);
  });

  it('returns true when Monad call trace errors contain a reserve balance violation', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
            tokenBalanceChanges: [],
          },
        }),
      ),
    ).toBe(true);
  });

  it('returns false when reserve balance violation appears on a non-Monad chain', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          chainId: CHAIN_IDS.MAINNET,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
            debug: {},
          },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when Monad simulation failure is unrelated', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction({
          ...CONFIRMATION_MOCK,
          simulationFails: {
            reason: 'execution reverted: out of gas',
            debug: {},
          },
        }),
      ),
    ).toBe(false);
  });
});
