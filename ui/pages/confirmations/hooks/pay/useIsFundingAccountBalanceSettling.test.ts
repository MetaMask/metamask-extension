import type { TransactionMeta } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { useTransactionAccountOverride } from '../transactions/useTransactionAccountOverride';
import { useAccountTokensLoading } from '../send/useAccountTokensLoading';
import {
  ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS,
  useIsFundingAccountBalanceSettling,
} from './useIsFundingAccountBalanceSettling';

jest.mock('../transactions/useTransactionAccountOverride');
jest.mock('../send/useAccountTokensLoading');

const ACCOUNT_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ACCOUNT_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function runHook(isLiveBalance: boolean) {
  const transaction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.MAINNET,
  }) as TransactionMeta;

  return renderHookWithConfirmContextProvider(
    () => useIsFundingAccountBalanceSettling(isLiveBalance),
    getMockConfirmStateForTransaction(transaction),
  );
}

describe('useIsFundingAccountBalanceSettling', () => {
  const useTransactionAccountOverrideMock = jest.mocked(
    useTransactionAccountOverride,
  );
  const useAccountTokensLoadingMock = jest.mocked(useAccountTokensLoading);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    useTransactionAccountOverrideMock.mockReturnValue(ACCOUNT_A);
    useAccountTokensLoadingMock.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not report settling on first render with a snapshot balance', () => {
    // Initial mount is not a switch — suppressing here would hide the alert
    // for flows that legitimately only ever have a snapshot balance.
    const { result } = runHook(false);

    expect(result.current).toBe(false);
  });

  it('reports settling while the override account assets are loading', () => {
    useAccountTokensLoadingMock.mockReturnValue(true);

    const { result } = runHook(false);

    expect(result.current).toBe(true);
  });

  it('does not report settling once the balance is live', () => {
    useAccountTokensLoadingMock.mockReturnValue(true);

    const { result } = runHook(true);

    expect(result.current).toBe(false);
  });

  it('reports settling in the same render the funding account changes', () => {
    const { result, rerender } = runHook(false);

    expect(result.current).toBe(false);

    // The stale snapshot must be distrusted immediately, with no intervening
    // frame where the previous account's balance is still authoritative.
    useTransactionAccountOverrideMock.mockReturnValue(ACCOUNT_B);
    rerender();

    expect(result.current).toBe(true);
  });

  it('stops reporting settling after the timeout so a real check can run', () => {
    const { result, rerender } = runHook(false);

    useTransactionAccountOverrideMock.mockReturnValue(ACCOUNT_B);
    rerender();
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS);
    });

    expect(result.current).toBe(false);
  });
});
