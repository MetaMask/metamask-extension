import { Hex, Json } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  TransactionPayQuote,
  TransactionPayRequiredToken,
  TransactionPaySourceAmount,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayHasExecutableQuote,
  useTransactionPayHasPositiveRequiredAmount,
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPaySourceAmounts,
} from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useNoPayTokenQuotesAlert } from './useNoPayTokenQuotesAlert';

jest.mock('../../pay/useTransactionPayToken');
jest.mock('../../pay/useTransactionPayData');

const ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const CHAIN_ID_MOCK = '0x1' as Hex;

const PAY_TOKEN_MOCK = {
  address: ADDRESS_MOCK,
  chainId: CHAIN_ID_MOCK,
} as TransactionPaymentToken;

const SOURCE_AMOUNT_MOCK = {
  targetTokenAddress: ADDRESS_MOCK,
} as TransactionPaySourceAmount;

const REQUIRED_TOKEN_MOCK = {
  address: ADDRESS_MOCK,
  amountRaw: '1000000',
  skipIfBalance: false,
} as TransactionPayRequiredToken;

function runHook(state = getMockConfirmState()) {
  return renderHookWithConfirmContextProvider(
    () => useNoPayTokenQuotesAlert(),
    state,
  );
}

function getPerpsWithdrawState() {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation(),
    type: TransactionType.perpsWithdraw,
  } as TransactionMeta;

  return getMockConfirmStateForTransaction(transaction);
}

describe('useNoPayTokenQuotesAlert', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useTransactionPaySourceAmountsMock = jest.mocked(
    useTransactionPaySourceAmounts,
  );
  const useIsTransactionPayQuotePendingMock = jest.mocked(
    useIsTransactionPayQuotePending,
  );
  const useTransactionPayHasExecutableQuoteMock = jest.mocked(
    useTransactionPayHasExecutableQuote,
  );
  const useTransactionPayHasPositiveRequiredAmountMock = jest.mocked(
    useTransactionPayHasPositiveRequiredAmount,
  );
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      isNative: false,
      setPayToken: jest.fn(),
    });

    useIsTransactionPayQuotePendingMock.mockReturnValue(false);
    useTransactionPayHasExecutableQuoteMock.mockReturnValue(false);
    useTransactionPayHasPositiveRequiredAmountMock.mockReturnValue(true);
    useTransactionPayQuotesMock.mockReturnValue(undefined);
    useTransactionPaySourceAmountsMock.mockReturnValue([SOURCE_AMOUNT_MOCK]);
    useTransactionPayRequiredTokensMock.mockReturnValue([REQUIRED_TOKEN_MOCK]);
  });

  it('returns alert if pay token selected and no quotes available', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.NoPayTokenQuotes,
        field: RowAlertKey.PayWith,
        message:
          "This payment route isn't available right now. Try changing the amount, network, or token and we'll find the best option.",
        reason: 'No quotes',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns no alerts if quotes available', () => {
    useTransactionPayQuotesMock.mockReturnValue([
      {} as TransactionPayQuote<Json>,
    ]);

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alerts if quotes loading', () => {
    useIsTransactionPayQuotePendingMock.mockReturnValue(true);

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alerts if no pay token selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      isNative: false,
      setPayToken: jest.fn(),
    });

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alerts if no source amounts', () => {
    useTransactionPaySourceAmountsMock.mockReturnValue(undefined);

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alerts if all source amounts have skipIfBalance', () => {
    useTransactionPayRequiredTokensMock.mockReturnValue([
      {
        ...REQUIRED_TOKEN_MOCK,
        skipIfBalance: true,
      },
    ]);

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  describe('Perps withdrawal', () => {
    beforeEach(() => {
      useTransactionPayHasExecutableQuoteMock.mockReturnValue(true);
      useTransactionPayQuotesMock.mockReturnValue([
        {} as TransactionPayQuote<Json>,
      ]);
    });

    it('returns no alert while post-quote setup is pending', () => {
      useIsTransactionPayQuotePendingMock.mockReturnValue(true);

      const { result } = runHook(getPerpsWithdrawState());

      expect(result.current).toStrictEqual([]);
    });

    it('returns an alert when the payment token is not selected', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: undefined,
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook(getPerpsWithdrawState());

      expect(result.current).toStrictEqual([
        expect.objectContaining({
          key: AlertsName.NoPayTokenQuotes,
          reason: 'No quotes',
          isBlocking: true,
        }),
      ]);
    });

    it('returns an alert when no executable quote is available', () => {
      useTransactionPayHasExecutableQuoteMock.mockReturnValue(false);

      const { result } = runHook(getPerpsWithdrawState());

      expect(result.current).toStrictEqual([
        expect.objectContaining({
          key: AlertsName.NoPayTokenQuotes,
          reason: 'No quotes',
          isBlocking: true,
        }),
      ]);
    });

    it('returns no alert when an executable quote is ready', () => {
      const { result } = runHook(getPerpsWithdrawState());

      expect(result.current).toStrictEqual([]);
    });
  });
});
