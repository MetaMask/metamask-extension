import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { useIsEnforcedSimulationsDisplayed } from './useIsEnforcedSimulationsDisplayed';

function runHook(containerTypes?: TransactionContainerType[]) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    containerTypes,
    origin: 'https://some-dapp.com',
    chainId: '0x1',
  });

  const state = getMockConfirmStateForTransaction(
    transaction as unknown as TransactionMeta,
  );

  const { result } = renderHookWithConfirmContextProvider(
    () => useIsEnforcedSimulationsDisplayed(),
    state,
  );

  return result.current;
}

describe('useIsEnforcedSimulationsDisplayed', () => {
  it('returns false if container types are not applied', () => {
    expect(runHook(undefined)).toBe(false);
  });

  it('returns true if container types are applied but empty', () => {
    expect(runHook([])).toBe(true);
  });

  it('returns true if enforced simulations container type is applied', () => {
    expect(runHook([TransactionContainerType.EnforcedSimulations])).toBe(true);
  });
});
