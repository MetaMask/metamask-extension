import { TransactionMeta, TransactionType } from '@metamask/transaction-controller';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { useTransactionCustomAmount } from '../../transactions/useTransactionCustomAmount';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { usePerpsWithdrawInsufficientBalanceAlert } from './usePerpsWithdrawInsufficientBalanceAlert';

jest.mock('../../../../../hooks/perps/stream');
jest.mock('../../transactions/useTransactionCustomAmount');

const mockUsePerpsLiveAccount = jest.mocked(usePerpsLiveAccount);
const mockUseTransactionCustomAmount = jest.mocked(useTransactionCustomAmount);

const EXPECTED_ALERT = {
  field: RowAlertKey.EstimatedFee,
  isBlocking: true,
  key: AlertsName.InsufficientPayTokenBalance,
  message: 'Amount exceeds your available Perps balance.',
  reason: 'Enter a valid amount.',
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

function setAccountBalance(availableBalance: string | undefined) {
  mockUsePerpsLiveAccount.mockReturnValue({
    account: availableBalance
      ? ({ availableBalance } as Awaited<
          ReturnType<typeof usePerpsLiveAccount>
        >['account'])
      : null,
    isInitialLoading: false,
  });
}

function setEnteredAmount(amountFiat: string) {
  mockUseTransactionCustomAmount.mockReturnValue({
    amountFiat,
  } as ReturnType<typeof useTransactionCustomAmount>);
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
});
