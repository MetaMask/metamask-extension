import { act, renderHook } from '@testing-library/react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { useSelector } from 'react-redux';
import { getRemoteFeatureFlags } from '../../../../../shared/lib/selectors/remote-feature-flags';
import {
  selectDepositLimits,
  selectRelayFixedSpread,
} from '../../selectors/feature-flags';
import { isRouteToken } from '../../utils/relay-fixed-spread';
import { useTransactionPayToken } from '../pay/useTransactionPayToken';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';
import { useDepositPrefillAmount } from './useDepositPrefillAmount';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../utils/relay-fixed-spread', () => ({
  ...jest.requireActual('../../utils/relay-fixed-spread'),
  isRouteToken: jest.fn(),
}));

jest.mock('../pay/useTransactionPayToken');
jest.mock('./useTransactionMetadataRequest');
jest.mock('./useTransactionAccountOverride');

const TOKEN_ADDRESS_MOCK = '0x1234567890123456789012345678901234567890' as Hex;
const TOKEN_ADDRESS_B_MOCK =
  '0x9876543210987654321098765432109876543210' as Hex;
const CHAIN_ID_MOCK = '0x1' as Hex;
const TRANSACTION_ID_MOCK = 'test-tx-id';

const useTransactionMetadataRequestMock = jest.mocked(
  useTransactionMetadataRequest,
);
const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
const useTransactionAccountOverrideMock = jest.mocked(
  useTransactionAccountOverride,
);
const useSelectorMock = jest.mocked(useSelector);
const isRouteTokenMock = jest.mocked(isRouteToken);

function makeTransactionMeta(
  overrides?: Partial<TransactionMeta>,
): TransactionMeta {
  return {
    id: TRANSACTION_ID_MOCK,
    type: TransactionType.moneyAccountDeposit,
    chainId: CHAIN_ID_MOCK,
    txParams: { from: '0xabc' },
    ...overrides,
  } as unknown as TransactionMeta;
}

function makePayToken(
  overrides?: Partial<TransactionPaymentToken>,
): TransactionPaymentToken {
  return {
    address: TOKEN_ADDRESS_MOCK,
    balanceUsd: '1000',
    chainId: CHAIN_ID_MOCK,
    ...overrides,
  } as TransactionPaymentToken;
}

function setupMocks(
  overrides: {
    prefilledAmountDefault?: { enabled: boolean };
    prefilledAmountOverrides?: Record<string, { enabled: boolean }>;
    depositLimits?: Record<string, number>;
    payToken?: TransactionPaymentToken | null;
    transactionMeta?: TransactionMeta;
    accountOverride?: Hex;
    stablecoin?: boolean;
  } = {},
) {
  const {
    prefilledAmountDefault = { enabled: false },
    prefilledAmountOverrides = { moneyAccountDeposit: { enabled: true } },
    depositLimits = {},
    transactionMeta = makeTransactionMeta(),
    stablecoin = true,
  } = overrides;

  const resolvedPayToken =
    'payToken' in overrides
      ? (overrides.payToken ?? undefined)
      : makePayToken();

  useTransactionMetadataRequestMock.mockReturnValue(transactionMeta);
  useTransactionPayTokenMock.mockReturnValue({
    payToken: resolvedPayToken,
    setPayToken: jest.fn(),
    isNative: false,
  } as ReturnType<typeof useTransactionPayToken>);
  useTransactionAccountOverrideMock.mockReturnValue(overrides.accountOverride);

  useSelectorMock.mockImplementation((selector) => {
    if (selector === getRemoteFeatureFlags) {
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmations_pay_extended: {
          prefilledAmount: {
            default: prefilledAmountDefault,
            overrides: prefilledAmountOverrides,
          },
        },
      };
    }
    if (selector === selectDepositLimits) {
      return depositLimits;
    }
    if (selector === selectRelayFixedSpread) {
      return { routes: [] };
    }
    return undefined;
  });

  isRouteTokenMock.mockReturnValue(stablecoin);
}

function runHook() {
  return renderHook(() => useDepositPrefillAmount());
}

describe('useDepositPrefillAmount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupMocks();
  });

  describe('enabled/disabled', () => {
    it('returns disabled result when flag is disabled', () => {
      setupMocks({
        prefilledAmountDefault: { enabled: false },
        prefilledAmountOverrides: {},
      });

      const { result } = runHook();

      expect(result.current).toEqual({
        prefillAmount: undefined,
        enabled: false,
        isLoading: false,
        hasPrefilled: false,
      });
    });

    it('returns enabled when flag has override for moneyAccountDeposit', () => {
      setupMocks();

      const { result } = runHook();

      expect(result.current.enabled).toBe(true);
      expect(result.current.hasPrefilled).toBe(true);
      expect(result.current.prefillAmount).toBeDefined();
    });
  });

  describe('prefillAmount computation', () => {
    it('computes 100% for stablecoin route tokens', () => {
      setupMocks({
        stablecoin: true,
        payToken: makePayToken({ balanceUsd: '500' }),
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBe('500');
    });

    it('computes 50% for non-stablecoin tokens', () => {
      setupMocks({
        stablecoin: false,
        payToken: makePayToken({ balanceUsd: '1000' }),
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBe('500');
    });

    it('caps at deposit limit when balance exceeds it', () => {
      setupMocks({
        stablecoin: true,
        payToken: makePayToken({ balanceUsd: '200000' }),
        depositLimits: { moneyAccountDeposit: 100000 },
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBe('100000');
    });

    it('returns undefined when no payToken', () => {
      setupMocks({ payToken: null });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBeUndefined();
    });

    it('returns undefined when balanceUsd is 0', () => {
      setupMocks({
        payToken: makePayToken({ balanceUsd: '0' }),
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBeUndefined();
    });

    it('formats integer amounts without decimals', () => {
      setupMocks({
        stablecoin: true,
        payToken: makePayToken({ balanceUsd: '500' }),
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBe('500');
      expect(result.current.prefillAmount).not.toBe('500.00');
    });

    it('formats decimal amounts to 2 places', () => {
      setupMocks({
        stablecoin: false,
        payToken: makePayToken({ balanceUsd: '2.54' }),
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBe('1.27');
    });

    it('handles high-precision balanceUsd without throwing', () => {
      setupMocks({
        stablecoin: true,
        payToken: makePayToken({ balanceUsd: '7.129952593380517' }),
      });

      const { result } = runHook();

      expect(result.current.prefillAmount).toBe('7.12');
    });
  });

  describe('commit effect', () => {
    it('sets isLoading to false after commit', () => {
      setupMocks();

      const { result } = runHook();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasPrefilled).toBe(true);
    });

    it('only commits once when balance changes on same token', async () => {
      setupMocks({
        stablecoin: true,
        payToken: makePayToken({ balanceUsd: '500' }),
      });

      const { result, rerender } = runHook();

      expect(result.current.hasPrefilled).toBe(true);
      expect(result.current.prefillAmount).toBe('500');

      useTransactionPayTokenMock.mockReturnValue({
        payToken: makePayToken({ balanceUsd: '9999' }),
        setPayToken: jest.fn(),
        isNative: false,
      } as ReturnType<typeof useTransactionPayToken>);

      await act(async () => {
        rerender();
      });

      expect(result.current.hasPrefilled).toBe(true);
    });
  });

  describe('reset effect', () => {
    it('resets when switching to a zero-balance account', async () => {
      setupMocks();

      const { result, rerender } = runHook();

      expect(result.current.hasPrefilled).toBe(true);

      useTransactionAccountOverrideMock.mockReturnValue(
        '0xnewaccount000000000000000000000000000000' as Hex,
      );
      useTransactionPayTokenMock.mockReturnValue({
        payToken: makePayToken({ balanceUsd: '0' }),
        setPayToken: jest.fn(),
        isNative: false,
      } as ReturnType<typeof useTransactionPayToken>);

      await act(async () => {
        rerender();
      });

      expect(result.current.hasPrefilled).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('recommits for a new confirmation rendered by the same mounted UI', async () => {
      setupMocks();

      const hasPrefilledStates: boolean[] = [];
      const { result, rerender } = renderHook(() => {
        const value = useDepositPrefillAmount();
        hasPrefilledStates.push(value.hasPrefilled);
        return value;
      });

      expect(result.current.hasPrefilled).toBe(true);
      hasPrefilledStates.length = 0;

      useTransactionMetadataRequestMock.mockReturnValue(
        makeTransactionMeta({ id: 'second-tx-id' }),
      );

      await act(async () => {
        rerender();
      });

      // The commit is released before being re-applied so the consumer's
      // apply effect runs again for the new confirmation.
      expect(hasPrefilledStates).toContain(false);
      expect(result.current.hasPrefilled).toBe(true);
    });

    it('recommits with new amount when payToken address changes', async () => {
      setupMocks({
        stablecoin: true,
        payToken: makePayToken({ balanceUsd: '500' }),
      });

      const { result, rerender } = runHook();

      expect(result.current.hasPrefilled).toBe(true);
      expect(result.current.prefillAmount).toBe('500');

      useTransactionPayTokenMock.mockReturnValue({
        payToken: makePayToken({
          address: TOKEN_ADDRESS_B_MOCK,
          balanceUsd: '800',
        }),
        setPayToken: jest.fn(),
        isNative: false,
      } as ReturnType<typeof useTransactionPayToken>);

      await act(async () => {
        rerender();
      });

      expect(result.current.hasPrefilled).toBe(true);
      expect(result.current.prefillAmount).toBe('800');
    });
  });

  describe('isLoading', () => {
    it('true when enabled but not yet committed', () => {
      setupMocks({ payToken: null });

      const { result } = runHook();

      expect(result.current.isLoading).toBe(true);
    });

    it('false when not enabled', () => {
      setupMocks({
        prefilledAmountDefault: { enabled: false },
        prefilledAmountOverrides: {},
      });

      const { result } = runHook();

      expect(result.current.isLoading).toBe(false);
    });
  });
});
