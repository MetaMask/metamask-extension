import { AuthorizationList } from '@metamask/transaction-controller';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import {
  upgradeAccountConfirmation,
  upgradeAccountConfirmationOnly,
} from '../../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../../types/confirm';
import { EIP_7702_REVOKE_ADDRESS } from '../../../../hooks/useEIP7702Account';
import {
  useIsDowngradeTransaction,
  useIsUpgradeTransaction,
} from './useIsUpgradeTransaction';

function runUpgradeHook(authorizationList?: AuthorizationList) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    authorizationList,
  });

  const state = getMockConfirmStateForTransaction(transaction);

  const { result } = renderHookWithConfirmContextProvider(
    useIsUpgradeTransaction,
    state,
  );

  return result.current;
}

function runUpgradeHookForConfirmation(confirmation: Confirmation) {
  const state = getMockConfirmStateForTransaction(confirmation);

  const { result } = renderHookWithConfirmContextProvider(
    useIsUpgradeTransaction,
    state,
  );

  return result.current;
}

function runDowngradeHook(authorizationList?: AuthorizationList) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    authorizationList,
  });

  const state = getMockConfirmStateForTransaction(transaction);

  const { result } = renderHookWithConfirmContextProvider(
    useIsDowngradeTransaction,
    state,
  );

  return result.current as boolean;
}

describe('useIsUpgradeTransaction', () => {
  it('isUpgrade is true if authorization address is not empty', async () => {
    const result = runUpgradeHook([{ address: '0x123' }]);
    expect(result.isUpgrade).toBe(true);
    expect(result.isUpgradeOnly).toBe(false);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([undefined, null, []] as const)(
    'isUpgrade is false if authorizationList is %s',
    // @ts-expect-error This is missing from the Mocha type definitions
    async (authorizationList) => {
      const result = runUpgradeHook(
        authorizationList as unknown as AuthorizationList,
      );
      expect(result.isUpgrade).toBe(false);
      expect(result.isUpgradeOnly).toBe(false);
    },
  );

  it('isUpgrade is false if authorization address is zero address', async () => {
    const result = runUpgradeHook([{ address: EIP_7702_REVOKE_ADDRESS }]);
    expect(result.isUpgrade).toBe(false);
    expect(result.isUpgradeOnly).toBe(false);
  });

  it('isUpgradeOnly is false if authorization address is not empty and there is data', async () => {
    const result = runUpgradeHookForConfirmation(upgradeAccountConfirmation);
    expect(result.isUpgrade).toBe(true);
    expect(result.isUpgradeOnly).toBe(false);
  });

  it('isUpgradeOnly is true if authorization address is not empty and there is no data', async () => {
    const result = runUpgradeHookForConfirmation(
      upgradeAccountConfirmationOnly,
    );
    expect(result.isUpgrade).toBe(true);
    expect(result.isUpgradeOnly).toBe(true);
  });
});

describe('useIsDowngradeTransaction', () => {
  it('returns true if authorization address is zero address', async () => {
    const result = runDowngradeHook([{ address: EIP_7702_REVOKE_ADDRESS }]);
    expect(result).toBe(true);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([undefined, null, []] as const)(
    'returns false if authorization address is %s',
    // @ts-expect-error This is missing from the Mocha type definitions
    async (authorizationList) => {
      const result = runDowngradeHook(
        authorizationList as unknown as AuthorizationList,
      );
      expect(result).toBe(false);
    },
  );

  it('returns false if authorization address is other address', async () => {
    const result = runDowngradeHook([{ address: '0x123' }]);
    expect(result).toBe(false);
  });
});
