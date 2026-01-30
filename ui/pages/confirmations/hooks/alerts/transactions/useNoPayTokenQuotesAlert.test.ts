import { Hex, Json } from '@metamask/utils';
import {
  TransactionPayQuote,
  TransactionPayRequiredToken,
  TransactionPaySourceAmount,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
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
  skipIfBalance: false,
} as TransactionPayRequiredToken;

function runHook() {
  const state = getMockConfirmState();

  return renderHookWithConfirmContextProvider(
    () => useNoPayTokenQuotesAlert(),
    state,
  );
}

describe('useNoPayTokenQuotesAlert', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
  const useTransactionPaySourceAmountsMock = jest.mocked(
    useTransactionPaySourceAmounts,
  );
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
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

    useIsTransactionPayLoadingMock.mockReturnValue(false);
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
    useIsTransactionPayLoadingMock.mockReturnValue(true);

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
});
