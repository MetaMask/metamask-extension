import { Hex } from '@metamask/utils';
import {
  CHAIN_IDS,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  TransactionPayRequiredToken,
  TransactionPayTotals,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getNativeTokenCachedBalanceByChainIdSelector } from '../../../../selectors';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from '../pay/useTransactionPayData';
import { AlertsName } from '../alerts/constants';
import { usePerpsDepositInsufficientPayTokenBalanceAlert } from './usePerpsDepositInsufficientPayTokenBalanceAlert';

jest.mock('../pay/useTransactionPayToken');
jest.mock('../pay/useTransactionPayData');
jest.mock('../../../../selectors', () => ({
  ...jest.requireActual('../../../../selectors'),
  getNativeTokenCachedBalanceByChainIdSelector: jest.fn(),
}));

const PAY_TOKEN_MOCK = {
  address: '0x123' as Hex,
  chainId: '0x1' as Hex,
  balanceUsd: '10.00',
  balanceRaw: '10000000000000000000',
} as TransactionPaymentToken;

const REQUIRED_TOKEN_MOCK = {
  amountUsd: '5.00',
  skipIfBalance: false,
} as TransactionPayRequiredToken;

const TOTALS_MOCK = {
  fees: {
    sourceNetwork: {
      max: {
        raw: '1000000000000000',
        usd: '0.01',
      },
    },
    isSourceGasFeeToken: false,
  },
  sourceAmount: { raw: '5000000000000000000', usd: '5.00' },
} as TransactionPayTotals;

function runHook(
  transactionOverrides: Partial<TransactionMeta> = {},
  props: Parameters<
    typeof usePerpsDepositInsufficientPayTokenBalanceAlert
  >[0] = {},
) {
  const baseTransaction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.MAINNET,
  }) as TransactionMeta;
  const transaction = {
    ...baseTransaction,
    ...transactionOverrides,
    txParams: {
      ...baseTransaction.txParams,
      ...(transactionOverrides.txParams ?? {}),
    },
  } as TransactionMeta;

  const state = getMockConfirmStateForTransaction(transaction);

  return renderHookWithConfirmContextProvider(
    () => usePerpsDepositInsufficientPayTokenBalanceAlert(props),
    state,
  );
}

describe('usePerpsDepositInsufficientPayTokenBalanceAlert', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayIsMaxAmountMock = jest.mocked(
    useTransactionPayIsMaxAmount,
  );
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
  );
  const getNativeTokenCachedBalanceByChainIdSelectorMock = jest.mocked(
    getNativeTokenCachedBalanceByChainIdSelector,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayRequiredTokensMock.mockReturnValue([REQUIRED_TOKEN_MOCK]);
    useTransactionPayTotalsMock.mockReturnValue(TOTALS_MOCK);
    useTransactionPayIsMaxAmountMock.mockReturnValue(false);
    useIsTransactionPayLoadingMock.mockReturnValue(false);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      isNative: false,
      setPayToken: jest.fn(),
    });

    getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
      '0x1': '0x4563918244f40000',
    } as Record<Hex, Hex>);
  });

  it('returns no alerts for non-perps transaction types', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns input insufficient alert for perps deposit', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        ...PAY_TOKEN_MOCK,
        balanceUsd: '4.00',
      },
      isNative: false,
      setPayToken: jest.fn(),
    });

    const { result } = runHook({
      type: TransactionType.perpsDeposit,
      chainId: CHAIN_IDS.MAINNET,
    });

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.InsufficientPayTokenBalance,
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        message: 'Insufficient funds',
        severity: Severity.Danger,
      },
    ]);
  });

  it('returns no pay-token-fee alert when perps pay token balanceRaw is unavailable', () => {
    getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
      '0xa4b1': '0x1bc16d674ec80000',
    } as Record<Hex, Hex>);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        ...PAY_TOKEN_MOCK,
        chainId: '0xa4b1' as Hex,
        balanceRaw: undefined,
        balance: '10.0',
      } as unknown as TransactionPaymentToken,
      isNative: false,
      setPayToken: jest.fn(),
    });

    const { result } = runHook({
      type: TransactionType.perpsDeposit,
      chainId: '0xa4b1' as Hex,
    });

    expect(result.current).toStrictEqual([]);
  });

  it('returns native-fee alert for perps when source native balance is insufficient', () => {
    getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
      '0xa4b1': '0x0',
    } as Record<Hex, Hex>);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        ...PAY_TOKEN_MOCK,
        address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: '0xa4b1' as Hex,
        balanceRaw: '5000000000000000000',
      },
      isNative: false,
      setPayToken: jest.fn(),
    });

    useTransactionPayTotalsMock.mockReturnValue({
      ...TOTALS_MOCK,
      sourceAmount: { raw: '5000000000000000000', usd: '5.00' },
      fees: {
        ...TOTALS_MOCK.fees,
        sourceNetwork: {
          max: {
            raw: '1000000000000000',
            usd: '0.01',
          },
        },
        isSourceGasFeeToken: false,
      },
    });

    const { result } = runHook({
      type: TransactionType.perpsDeposit,
      chainId: '0xa4b1' as Hex,
    });

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.InsufficientPayTokenNative,
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        reason: 'Insufficient funds',
        message: expect.stringContaining('Not enough'),
        severity: Severity.Danger,
      },
    ]);
  });
});
