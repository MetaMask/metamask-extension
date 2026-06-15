import type { AccountState } from '@metamask/perps-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getPerpsStreamManager } from '../../../../../providers/perps';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { usePerpsWithdrawInsufficientBalanceAlert } from './usePerpsWithdrawInsufficientBalanceAlert';

jest.mock('../../../../../providers/perps', () => ({
  ...jest.requireActual('../../../../../providers/perps'),
  getPerpsStreamManager: jest.fn(),
}));
jest.mock('../../pay/useTransactionPayData');

const mockGetPerpsStreamManager = jest.mocked(getPerpsStreamManager);
const mockUsePrimaryRequiredToken = jest.mocked(
  useTransactionPayPrimaryRequiredToken,
);

function mockStreamManagerAccount(account: AccountState | null) {
  mockGetPerpsStreamManager.mockReturnValue({
    account: { getCachedData: () => account },
  } as ReturnType<typeof getPerpsStreamManager>);
}

const EXPECTED_ALERT = {
  field: RowAlertKey.EstimatedFee,
  isBlocking: true,
  key: AlertsName.InsufficientPayTokenBalance,
  message: 'Insufficient funds',
  reason: 'Insufficient funds',
  severity: Severity.Danger,
};

function buildPerpsWithdrawState() {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation(),
    type: TransactionType.perpsWithdraw,
  } as TransactionMeta;
  return getMockConfirmStateForTransaction(transaction);
}

function runHook(state: ReturnType<typeof buildPerpsWithdrawState>) {
  return renderHookWithConfirmContextProvider(
    () => usePerpsWithdrawInsufficientBalanceAlert(),
    state,
  );
}

function setAccountBalance(withdrawableBalance: string | undefined) {
  mockStreamManagerAccount(
    withdrawableBalance ? ({ withdrawableBalance } as AccountState) : null,
  );
}

function setAccount(account: {
  spendableBalance?: string;
  withdrawableBalance?: string;
}) {
  mockStreamManagerAccount(account as AccountState);
}

function setEnteredAmount(amountFiat: string) {
  mockUsePrimaryRequiredToken.mockReturnValue({
    amountFiat,
  } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);
}

describe('usePerpsWithdrawInsufficientBalanceAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setAccountBalance('100');
    setEnteredAmount('10');
  });

  it('returns no alert when entered amount is below the available balance', () => {
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when entered amount equals the available balance', () => {
    setEnteredAmount('100');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([]);
  });

  it('returns a blocking alert when entered amount exceeds the available balance', () => {
    setEnteredAmount('150');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([EXPECTED_ALERT]);
  });

  it('returns no alert when entered amount is zero', () => {
    setEnteredAmount('0');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([]);
  });

  it('treats a missing perps account balance as zero (no entered amount → no alert)', () => {
    setAccountBalance(undefined);
    setEnteredAmount('0');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([]);
  });

  it('alerts when a missing perps account balance is paired with a non-zero amount', () => {
    setAccountBalance(undefined);
    setEnteredAmount('1');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([EXPECTED_ALERT]);
  });

  it('returns no alert for non-perpsWithdraw transactions even when the amount exceeds balance', () => {
    setEnteredAmount('150');
    const contractInteraction =
      genUnapprovedContractInteractionConfirmation() as TransactionMeta;
    const state = getMockConfirmStateForTransaction(contractInteraction);
    const { result } = renderHookWithConfirmContextProvider(
      () => usePerpsWithdrawInsufficientBalanceAlert(),
      state,
    );
    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when there is no current confirmation', () => {
    setEnteredAmount('150');
    const { result } = renderHookWithConfirmContextProvider(
      () => usePerpsWithdrawInsufficientBalanceAlert(),
      getMockConfirmState(),
    );
    expect(result.current).toStrictEqual([]);
  });

  it('uses `withdrawableBalance` over `spendableBalance` for the threshold', () => {
    // Unified mode: `spendableBalance` is $0 (perps clearinghouse) but the
    // user actually has $50 of withdrawable balance.
    // Withdrawing $40 must NOT trigger the alert.
    setAccount({ spendableBalance: '0', withdrawableBalance: '50' });
    setEnteredAmount('40');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([]);
  });

  it('alerts when entered amount exceeds `withdrawableBalance`', () => {
    setAccount({ spendableBalance: '0', withdrawableBalance: '50' });
    setEnteredAmount('51');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([EXPECTED_ALERT]);
  });

  it('returns no alert when Max only exceeds the balance below Perps precision', () => {
    setAccount({ spendableBalance: '0', withdrawableBalance: '7.863083' });
    setEnteredAmount('7.8630830000000005');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([]);
  });

  it('alerts when entered amount exceeds the balance by one Perps precision unit', () => {
    setAccount({ spendableBalance: '0', withdrawableBalance: '7.863083' });
    setEnteredAmount('7.863084');
    const { result } = runHook(buildPerpsWithdrawState());
    expect(result.current).toStrictEqual([EXPECTED_ALERT]);
  });

  it('uses `amountFiat` (typed USD) over `amountUsd` (token count × $1) for the threshold', () => {
    // For USDC at market rate ≈ 0.9998, the user typing $39.83 produces a
    // required token with `amountFiat` ≈ 39.83 (their real USD intent) but
    // `amountUsd` ≈ 39.84 (token count priced at $1). The HL balance is
    // 39.833436. Only `amountFiat` keeps the strict `>` semantic so a user
    // can withdraw exactly their available balance without a false-positive.
    setAccount({ spendableBalance: '0', withdrawableBalance: '39.833436' });
    mockUsePrimaryRequiredToken.mockReturnValue({
      amountFiat: '39.83000054846650769962',
      amountUsd: '39.838382',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    const { result } = runHook(buildPerpsWithdrawState());

    expect(result.current).toStrictEqual([]);
  });
});
