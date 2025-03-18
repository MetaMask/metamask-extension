import { AuthorizationList } from '@metamask/transaction-controller';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useIsUpgradeTransaction } from './useIsUpgradeTransaction';

function runHook(authorizationList?: AuthorizationList) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    authorizationList,
  });

  const state = getMockConfirmStateForTransaction(transaction);

  const { result } = renderHookWithConfirmContextProvider(
    useIsUpgradeTransaction,
    state,
  );

  return result.current as boolean;
}

describe('useIsUpgradeTransaction', () => {
  it('returns true if authorizationList is not empty', async () => {
    const result = runHook([{ address: '0x123' }]);
    expect(result).toBe(true);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([undefined, null, []] as const)(
    'returns false if authorizationList is %s',
    async (authorizationList: never) => {
      const result = runHook(authorizationList);
      expect(result).toBe(false);
    },
  );
});
