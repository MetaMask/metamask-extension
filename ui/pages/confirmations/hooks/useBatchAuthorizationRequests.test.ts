import { TransactionStatus } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { Confirmation } from '../types/confirm';
import { useBatchAuthorizationRequests } from './useBatchAuthorizationRequests';

function runHook(transactionParameters: Partial<Confirmation> = {}) {
  const state = getMockConfirmStateForTransaction({
    chainId: '0x123',
    status: TransactionStatus.submitted,
    txParams: {
      authorizationList: [{ address: '0x456' }],
      from: '0x0',
    },
    ...transactionParameters,
  } as unknown as Confirmation);
  const { result, rerender } = renderHookWithProvider(
    () => useBatchAuthorizationRequests('0x0', '0x123'),
    state,
  );
  return { result: result.current, rerender };
}

describe('useBatchAuthorizationRequests', () => {
  it('returns true if there are pending confirmation for authorisation', () => {
    const { result } = runHook();
    expect(result.hasPendingRequests).toBe(true);
  });

  it('returns false if there are no pending confirmation for authorisation', () => {
    const { result } = runHook({ status: TransactionStatus.confirmed });
    expect(result.hasPendingRequests).toBe(false);
  });
});
