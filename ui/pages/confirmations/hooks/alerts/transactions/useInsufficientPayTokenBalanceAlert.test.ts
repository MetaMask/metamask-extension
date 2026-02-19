import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  CHAIN_IDS,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  TransactionPayRequiredToken,
  TransactionPayTotals,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from '../../pay/useTransactionPayData';
import { getNativeTokenCachedBalanceByChainIdSelector } from '../../../../../selectors';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useInsufficientPayTokenBalanceAlert } from './useInsufficientPayTokenBalanceAlert';

jest.mock('../../pay/useTransactionPayToken');
jest.mock('../../pay/useTransactionPayData');
jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
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

const NATIVE_TOKEN_ADDRESS =
  '0x0000000000000000000000000000000000000000' as Hex;

function runHook(
  props: Parameters<typeof useInsufficientPayTokenBalanceAlert>[0] = {},
  transactionOverrides: Partial<TransactionMeta> = {},
) {
  const baseTransaction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.MAINNET,
  }) as TransactionMeta;
  const contractInteraction = {
    ...baseTransaction,
    ...transactionOverrides,
    txParams: {
      ...baseTransaction.txParams,
      ...(transactionOverrides.txParams ?? {}),
    },
  } as TransactionMeta;

  const state = getMockConfirmStateForTransaction(contractInteraction);

  return renderHookWithConfirmContextProvider(
    () => useInsufficientPayTokenBalanceAlert(props),
    state,
  );
}

describe('useInsufficientPayTokenBalanceAlert', () => {
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
      '0x1': '0x4563918244f40000', // 5 ETH in raw hex
    } as Record<Hex, Hex>);
  });

  describe('for input', () => {
    it('returns no alert if pay token balance is greater than required token amount', () => {
      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });

    it('returns alert if pay token balance is less than required token amount', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          balanceUsd: '4.00',
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook();

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

    it('ignores required token amount if skipIfBalance is true', () => {
      useTransactionPayRequiredTokensMock.mockReturnValue([
        {
          ...REQUIRED_TOKEN_MOCK,
          skipIfBalance: true,
        },
      ]);

      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          balanceUsd: '4.00',
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });

    it('returns no alert when isMax is true regardless of required token amount', () => {
      useTransactionPayIsMaxAmountMock.mockReturnValue(true);

      useTransactionPayRequiredTokensMock.mockReturnValue([
        {
          ...REQUIRED_TOKEN_MOCK,
          amountUsd: '100.00',
        },
      ]);

      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });
  });

  describe('for fees', () => {
    it('returns alert if pay token balance is less than total source amount', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          balanceRaw: '4000000000000000000',
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook();

      expect(result.current).toStrictEqual([
        {
          key: AlertsName.InsufficientPayTokenFees,
          field: RowAlertKey.EstimatedFee,
          isBlocking: true,
          reason: 'Insufficient funds',
          message: 'Add less or use a different token.',
          severity: Severity.Danger,
        },
      ]);
    });

    it('returns no alert if pending amount is provided', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          balanceRaw: '4000000000000000000',
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook({ pendingAmountUsd: '1.00' });

      expect(result.current).toStrictEqual([]);
    });

    it('shows native-fee alert (not pay-token-fee alert) for perps deposit when pay token covers source amount', () => {
      getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
        '0xa4b1': '0x0',
      } as Record<Hex, Hex>);

      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: '0xa4b1' as Hex,
          // Enough for sourceAmount.raw (5e18), not enough for sourceAmount+sourceFee
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
            max: { raw: '1000000000000000', usd: '0.01' },
          },
          isSourceGasFeeToken: false,
        },
      });

      const { result } = runHook(
        {},
        {
          type: TransactionType.perpsDeposit,
          chainId: '0xa4b1' as Hex,
        },
      );

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

    it('returns no pay-token-fee alert when payToken.balanceRaw is unavailable', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          balanceRaw: undefined,
          // Legacy/alternate field that may be human-readable.
          balance: '10.0',
        } as unknown as TransactionPaymentToken,
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });
  });

  describe('for source network fee', () => {
    it('returns alert if native balance is less than total source network fee', () => {
      getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
        '0x1': '0x0',
      } as Record<Hex, Hex>);

      const { result } = runHook();

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

    it('returns no alert if pay token is native', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: NATIVE_TOKEN_ADDRESS,
          balanceRaw: '10000000000000000000',
        },
        isNative: true,
        setPayToken: jest.fn(),
      });

      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });

    it('returns no alert if source network is using gas fee token', () => {
      useTransactionPayTotalsMock.mockReturnValue({
        ...TOTALS_MOCK,
        fees: {
          ...TOTALS_MOCK.fees,
          isSourceGasFeeToken: true,
        },
      });

      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });

    it('shows native fee alert for perps deposit when fee data is ready and native balance is insufficient', () => {
      getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
        '0xa4b1': '0x0',
      } as Record<Hex, Hex>);

      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: '0xa4b1' as Hex,
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHook(
        {},
        {
          type: TransactionType.perpsDeposit,
          chainId: '0xa4b1' as Hex,
        },
      );

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

    it('uses raw native balance for source-network fee checks', () => {
      getNativeTokenCachedBalanceByChainIdSelectorMock.mockReturnValue({
        '0xa4b1': '0x1bc16d674ec80000', // 2 ETH in raw hex
      } as Record<Hex, Hex>);

      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: '0xa4b1' as Hex,
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      useTransactionPayTotalsMock.mockReturnValue({
        ...TOTALS_MOCK,
        fees: {
          ...TOTALS_MOCK.fees,
          sourceNetwork: {
            max: {
              raw: '1000000000000000',
              usd: '0.01',
            },
          },
        },
      });

      const { result } = runHook(
        {},
        {
          type: TransactionType.perpsDeposit,
          chainId: '0xa4b1' as Hex,
        },
      );

      expect(result.current).toStrictEqual([]);
    });

    it('returns no alert if pending amount is provided', () => {
      const { result } = runHook({ pendingAmountUsd: '1.00' });

      expect(result.current).toStrictEqual([]);
    });
  });

  it('returns no alert if no pay token is selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      isNative: false,
      setPayToken: jest.fn(),
    });

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert if loading', () => {
    useIsTransactionPayLoadingMock.mockReturnValue(true);

    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        ...PAY_TOKEN_MOCK,
        balanceRaw: '100',
      },
      isNative: false,
      setPayToken: jest.fn(),
    });

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });
});
