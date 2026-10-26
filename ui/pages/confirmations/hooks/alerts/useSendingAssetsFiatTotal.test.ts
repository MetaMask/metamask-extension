import { BigNumber } from 'bignumber.js';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { useBalanceChanges } from '../../components/simulation-details/useBalanceChanges';
import { BalanceChange } from '../../components/simulation-details/types';
import { useSendingAssetsFiatTotal } from './useSendingAssetsFiatTotal';

jest.mock('../../components/simulation-details/useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(),
}));

jest.mock('../../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (amount: number) => `$${amount}`,
}));

jest.mock('../../../../selectors', () => ({
  ...jest.requireActual('../../../../selectors'),
  getShouldShowFiat: jest.fn(() => true),
}));

const useBalanceChangesMock = useBalanceChanges as jest.Mock;

function buildBalanceChange(
  amount: number,
  fiatAmount: number | null,
  usdAmount: number | null = fiatAmount,
): BalanceChange {
  return {
    asset: { chainId: '0x5', standard: 'NONE' },
    amount: new BigNumber(amount),
    fiatAmount,
    usdAmount,
  } as unknown as BalanceChange;
}

function renderHook(balanceChanges: BalanceChange[], pending = false) {
  useBalanceChangesMock.mockReturnValue({ pending, value: balanceChanges });

  const state = getMockConfirmStateForTransaction({
    id: '1',
    type: TransactionType.contractInteraction,
    chainId: '0x5',
    status: TransactionStatus.unapproved,
    simulationData: { tokenBalanceChanges: [] },
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const { result } = renderHookWithConfirmContextProvider(
    () => useSendingAssetsFiatTotal(),
    state,
  );

  return result;
}

describe('useSendingAssetsFiatTotal', () => {
  it('returns the formatted total of outgoing assets only', () => {
    const result = renderHook([
      buildBalanceChange(-1, -100),
      buildBalanceChange(-2, -50),
      buildBalanceChange(3, 999),
    ]);
    expect(result.current).toBe('$150');
  });

  it('returns null when there are no outgoing assets', () => {
    const result = renderHook([buildBalanceChange(3, 999)]);
    expect(result.current).toBeNull();
  });

  it('returns null when fiat conversion is unavailable', () => {
    const result = renderHook([buildBalanceChange(-1, null, null)]);
    expect(result.current).toBeNull();
  });

  it('returns null when the USD total exceeds the display ceiling', () => {
    const result = renderHook([
      buildBalanceChange(-1, -20_000_000, -20_000_000),
    ]);
    expect(result.current).toBeNull();
  });

  it('returns null while balance changes are pending', () => {
    const result = renderHook([buildBalanceChange(-1, -100)], true);
    expect(result.current).toBeNull();
  });

  it('returns null when the USD conversion is unavailable, so the ceiling cannot be checked', () => {
    const result = renderHook([buildBalanceChange(-1, -50_000_000, null)]);
    expect(result.current).toBeNull();
  });
});
