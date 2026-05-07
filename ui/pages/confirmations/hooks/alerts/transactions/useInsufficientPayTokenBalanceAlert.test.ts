import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
  CHAIN_IDS,
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
import { useTokenWithBalance } from '../../tokens/useTokenWithBalance';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useInsufficientPayTokenBalanceAlert } from './useInsufficientPayTokenBalanceAlert';

jest.mock('../../pay/useTransactionPayToken');
jest.mock('../../pay/useTransactionPayData');
jest.mock('../../tokens/useTokenWithBalance');

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

const NATIVE_TOKEN_MOCK = {
  address: '0x0000000000000000000000000000000000000000' as Hex,
  chainId: '0x1' as Hex,
  balance: '5000000000000000000',
};

function runHook(
  props: Parameters<typeof useInsufficientPayTokenBalanceAlert>[0] = {},
) {
  const contractInteraction = genUnapprovedContractInteractionConfirmation({
    chainId: CHAIN_IDS.MAINNET,
  }) as TransactionMeta;

  const state = getMockConfirmStateForTransaction(contractInteraction);

  return renderHookWithConfirmContextProvider(
    () => useInsufficientPayTokenBalanceAlert(props),
    state,
  );
}

function runHookForPerpsWithdraw(
  props: Parameters<typeof useInsufficientPayTokenBalanceAlert>[0] = {},
  { chainId = CHAIN_IDS.ARBITRUM as Hex } = {},
) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation({ chainId }),
    type: TransactionType.perpsWithdraw,
  } as TransactionMeta;

  const state = getMockConfirmStateForTransaction(transaction);

  return renderHookWithConfirmContextProvider(
    () => useInsufficientPayTokenBalanceAlert(props),
    state,
  );
}

describe('useInsufficientPayTokenBalanceAlert', () => {
  const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTokenWithBalanceMock = jest.mocked(useTokenWithBalance);
  const useTransactionPayIsMaxAmountMock = jest.mocked(
    useTransactionPayIsMaxAmount,
  );
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const useIsTransactionPayLoadingMock = jest.mocked(
    useIsTransactionPayLoading,
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

    useTokenWithBalanceMock.mockReturnValue({
      address: NATIVE_TOKEN_MOCK.address,
      chainId: NATIVE_TOKEN_MOCK.chainId,
      symbol: 'ETH',
      decimals: 18,
      balance: '5',
      balanceRaw: NATIVE_TOKEN_MOCK.balance,
      balanceFiat: '$0.00',
      tokenFiatAmount: 0,
    });
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
          reason: 'Insufficient funds',
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
  });

  describe('for source network fee', () => {
    it('returns alert if native balance is less than total source network fee', () => {
      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: NATIVE_TOKEN_MOCK.chainId,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

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
      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: NATIVE_TOKEN_MOCK.chainId,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: NATIVE_TOKEN_MOCK.address,
          balanceRaw: '10000000000000000000',
        },
        isNative: true,
        setPayToken: jest.fn(),
      });

      const { result } = runHook();

      expect(result.current).toStrictEqual([]);
    });

    it('returns no alert if source network is using gas fee token', () => {
      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: NATIVE_TOKEN_MOCK.chainId,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

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

    it('returns no alert if pending amount is provided', () => {
      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: NATIVE_TOKEN_MOCK.chainId,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

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

  // For Perps Withdraw (and other post-quote flows), `payToken` is the
  // *destination* token — its balance has nothing to do with whether the
  // user can fund the withdraw. Only the source-network gas check on the
  // transaction's own chainId remains relevant.
  describe('post-quote (perpsWithdraw)', () => {
    it('returns no alert when pay token balance is less than required token amount', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          chainId: '0x38' as Hex,
          balanceUsd: '4.00',
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHookForPerpsWithdraw();

      expect(result.current).toStrictEqual([]);
    });

    it('returns no alert for fees check when pay token raw balance is below source amount', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          chainId: '0x38' as Hex,
          balanceRaw: '4000000000000000000',
        },
        isNative: false,
        setPayToken: jest.fn(),
      });

      const { result } = runHookForPerpsWithdraw();

      expect(result.current).toStrictEqual([]);
    });

    it('still raises the source-network alert when native balance on the tx chain is below gas fee', () => {
      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: CHAIN_IDS.ARBITRUM as Hex,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

      const { result } = runHookForPerpsWithdraw();

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

    it('runs the source-network alert even when no payToken has been selected yet', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: undefined,
        isNative: false,
        setPayToken: jest.fn(),
      });

      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: CHAIN_IDS.ARBITRUM as Hex,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

      const { result } = runHookForPerpsWithdraw();

      expect(result.current).toStrictEqual([
        expect.objectContaining({
          key: AlertsName.InsufficientPayTokenNative,
        }),
      ]);
    });

    it('treats payToken as non-native when it is on a different chain than the transaction (suppression guard)', () => {
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: NATIVE_TOKEN_MOCK.address,
          chainId: '0x38' as Hex,
          balanceRaw: '10000000000000000000',
        },
        // `isNative` from `useTransactionPayToken` is computed against the
        // pay-token's own chain — for post-quote we must re-evaluate against
        // the transaction's source chain instead.
        isNative: true,
        setPayToken: jest.fn(),
      });

      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: CHAIN_IDS.ARBITRUM as Hex,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

      const { result } = runHookForPerpsWithdraw();

      expect(result.current).toStrictEqual([
        expect.objectContaining({
          key: AlertsName.InsufficientPayTokenNative,
        }),
      ]);
    });

    it('still raises the source-network alert when payToken is the native token of the source chain', () => {
      // Withdrawing TO ETH on Arbitrum (same chain as the placeholder tx).
      // For non-post-quote this would mark the pay token native and suppress
      // the gas check; in post-quote `payToken` is the destination, so the
      // gas check must remain live against the user's source native balance.
      useTransactionPayTokenMock.mockReturnValue({
        payToken: {
          ...PAY_TOKEN_MOCK,
          address: NATIVE_TOKEN_MOCK.address,
          chainId: CHAIN_IDS.ARBITRUM as Hex,
          balanceRaw: '10000000000000000000',
        },
        isNative: true,
        setPayToken: jest.fn(),
      });

      useTokenWithBalanceMock.mockReturnValue({
        address: NATIVE_TOKEN_MOCK.address,
        chainId: CHAIN_IDS.ARBITRUM as Hex,
        symbol: 'ETH',
        decimals: 18,
        balance: '0.0001',
        balanceRaw: '100000000000000',
        balanceFiat: '$0.00',
        tokenFiatAmount: 0,
      });

      const { result } = runHookForPerpsWithdraw();

      expect(result.current).toStrictEqual([
        expect.objectContaining({
          key: AlertsName.InsufficientPayTokenNative,
        }),
      ]);
    });
  });
});
