import { BigNumber } from 'bignumber.js';
import { useQuery } from '@metamask/react-data-query';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import { DATA_SERVICES } from '../../../../../../shared/constants/data-services';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../../../../shared/lib/money/query-keys';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { useLastMoneyAccountWithdrawAmount } from '../../transactions/useLastMoneyAccountWithdrawAmount';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useInsufficientMoneyAccountBalanceAlert } from './useInsufficientMoneyAccountBalanceAlert';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));
jest.mock('../../pay/useTransactionPayData');
jest.mock('../../transactions/useLastMoneyAccountWithdrawAmount');

const useQueryMock = jest.mocked(useQuery);
const usePrimaryRequiredTokenMock = jest.mocked(
  useTransactionPayPrimaryRequiredToken,
);
const useLastMoneyAccountWithdrawAmountMock = jest.mocked(
  useLastMoneyAccountWithdrawAmount,
);

const EXPECTED_ALERT = {
  field: RowAlertKey.Amount,
  isBlocking: true,
  key: AlertsName.InsufficientMoneyAccountBalance,
  message: 'Insufficient funds',
  reason: 'Insufficient funds',
  severity: Severity.Danger,
};

const MONEY_ACCOUNT_ADDRESS = '0xabc0000000000000000000000000000000000001';

function musdUnits(human: string): string {
  return new BigNumber(human).times(1e6).toFixed(0);
}

function mockBalance({
  vmusdHuman,
  isLoading = false,
  isError = false,
}: {
  vmusdHuman?: string;
  isLoading?: boolean;
  isError?: boolean;
}) {
  useQueryMock.mockReturnValue({
    data:
      vmusdHuman === undefined
        ? undefined
        : ({
            vmusdValueInMusd: musdUnits(vmusdHuman),
          } as CanonicalMoneyAccountBalanceResponse),
    isLoading,
    isError,
  } as ReturnType<typeof useQuery>);
}

function runHook({
  pendingAmount,
  type = TransactionType.moneyAccountWithdraw,
}: {
  pendingAmount?: string;
  type?: TransactionType;
} = {}) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation(),
    type,
    txParams: {
      from: MONEY_ACCOUNT_ADDRESS,
    },
  } as TransactionMeta;

  return renderHookWithConfirmContextProvider(
    () => useInsufficientMoneyAccountBalanceAlert({ pendingAmount }),
    getMockConfirmStateForTransaction(transaction),
  );
}

describe('useInsufficientMoneyAccountBalanceAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockBalance({ vmusdHuman: '100' });
    usePrimaryRequiredTokenMock.mockReturnValue(
      undefined as unknown as ReturnType<
        typeof useTransactionPayPrimaryRequiredToken
      >,
    );
    useLastMoneyAccountWithdrawAmountMock.mockReturnValue(undefined);
  });

  it('returns alert when pending amount exceeds available balance', () => {
    const { result } = runHook({ pendingAmount: '150' });

    expect(result.current).toEqual([EXPECTED_ALERT]);
  });

  it('returns no alert when pending amount equals available balance', () => {
    const { result } = runHook({ pendingAmount: '100' });

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when pending amount is less than available balance', () => {
    const { result } = runHook({ pendingAmount: '50' });

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when withdrawableMusd is undefined', () => {
    mockBalance({});

    const { result } = runHook({ pendingAmount: '150' });

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert while the balance is loading', () => {
    mockBalance({ isLoading: true });

    const { result } = runHook({ pendingAmount: '150' });

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when the balance query failed', () => {
    mockBalance({ isError: true });

    const { result } = runHook({ pendingAmount: '150' });

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert when transaction type is not moneyAccountWithdraw', () => {
    const { result } = runHook({
      pendingAmount: '150',
      type: TransactionType.simpleSend,
    });

    expect(result.current).toStrictEqual([]);
  });

  it('queries the money account balance service for a withdraw', () => {
    runHook({ pendingAmount: '150' });

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
          MONEY_ACCOUNT_ADDRESS,
        ],
      }),
    );
  });

  it('does not use a data service query key for a non-withdraw confirmation', () => {
    // This hook runs for every confirmation via `useConfirmationAlerts`. The
    // query client opens a background `messengerSubscribe` on the first
    // observer of any data service key, so a money-account key here would
    // fire that subscription for unrelated confirmations.
    runHook({ pendingAmount: '150', type: TransactionType.simpleSend });

    const queryKey = useQueryMock.mock.calls[0][0].queryKey ?? [];

    expect(queryKey).not.toContain(
      MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
    );
    expect(
      DATA_SERVICES.some((service) =>
        String(queryKey[0]).startsWith(`${service}:`),
      ),
    ).toBe(false);
  });

  it('returns no alert when no pendingAmount is provided and defaults to zero', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns alert using required token amount when no pendingAmount provided', () => {
    usePrimaryRequiredTokenMock.mockReturnValue({
      amountHuman: '150',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    const { result } = runHook();

    expect(result.current).toEqual([EXPECTED_ALERT]);
  });

  it('returns no alert when required token amount is within balance', () => {
    usePrimaryRequiredTokenMock.mockReturnValue({
      amountHuman: '50',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns alert when the live typed amount exceeds the balance', () => {
    // Mirrors mobile: the alert reacts to the current input, not just the
    // debounced calldata commit.
    useLastMoneyAccountWithdrawAmountMock.mockReturnValue('150');

    const { result } = runHook();

    expect(result.current).toEqual([EXPECTED_ALERT]);
  });

  it('prefers the live typed amount over the stale required token amount', () => {
    // The user reduced the amount below the balance; the committed calldata
    // still carries the previous over-balance amount until the debounce
    // re-encodes. The alert must clear immediately.
    useLastMoneyAccountWithdrawAmountMock.mockReturnValue('50');
    usePrimaryRequiredTokenMock.mockReturnValue({
      amountHuman: '150',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('prefers pendingAmount over the live typed amount', () => {
    useLastMoneyAccountWithdrawAmountMock.mockReturnValue('50');

    const { result } = runHook({ pendingAmount: '150' });

    expect(result.current).toEqual([EXPECTED_ALERT]);
  });
});
