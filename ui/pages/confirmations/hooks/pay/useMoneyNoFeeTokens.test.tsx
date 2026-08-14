import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { ConfirmContext } from '../../context/confirm';
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';
import { useMoneyNoFeeTokens } from './useMoneyNoFeeTokens';

jest.mock('../transactions/useTransactionMetadataRequest');

const ETH_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ETH_MUSD = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const TRANSACTION_ID = 'tx-id';

/* eslint-disable @typescript-eslint/naming-convention */
const RELAY_FIXED_SPREAD_FLAG = {
  chains: { eth: '0x1' },
  tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
  routes: [['eth', 'eth_usdc', 'eth', 'musd']],
};
/* eslint-enable @typescript-eslint/naming-convention */

const mockStore = configureMockStore();
const useTransactionMetadataRequestMock = jest.mocked(
  useTransactionMetadataRequest,
);

function renderUseMoneyNoFeeTokens({
  type = TransactionType.moneyAccountDeposit,
  payTokenAddress = ETH_USDC,
  remoteFeatureFlags = {
    /* eslint-disable @typescript-eslint/naming-convention -- remote flag name */
    confirmations_relay_fixed_spread: RELAY_FIXED_SPREAD_FLAG,
    /* eslint-enable @typescript-eslint/naming-convention */
  },
}: {
  type?: TransactionType;
  payTokenAddress?: string;
  remoteFeatureFlags?: Record<string, unknown>;
} = {}) {
  const payToken = {
    address: payTokenAddress,
    chainId: '0x1',
    symbol: 'TST',
    decimals: 6,
    balanceUsd: '100',
    balanceRaw: '100000000',
    balanceHuman: '100',
    balanceFiat: '100',
  } as TransactionPaymentToken;

  const store = mockStore({
    metamask: {
      remoteFeatureFlags,
      transactionData: {
        [TRANSACTION_ID]: {
          isLoading: false,
          paymentToken: payToken,
          tokens: [],
        },
      },
    },
  });

  useTransactionMetadataRequestMock.mockReturnValue({
    id: TRANSACTION_ID,
    type,
    txParams: {},
  } as TransactionMeta);

  const confirmContextValue = {
    currentConfirmation: {
      id: TRANSACTION_ID,
      type,
      txParams: {},
    } as TransactionMeta,
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
  };

  return renderHook(() => useMoneyNoFeeTokens(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ConfirmContext.Provider value={confirmContextValue as never}>
          {children}
        </ConfirmContext.Provider>
      </Provider>
    ),
  });
}

describe('useMoneyNoFeeTokens', () => {
  it('returns true for a subsidised source on a money account deposit', () => {
    const { result } = renderUseMoneyNoFeeTokens();

    expect(result.current.isMoneyNoFeeToken).toBe(true);
  });

  it('returns true for a subsidised source on a money account withdraw', () => {
    const { result } = renderUseMoneyNoFeeTokens({
      type: TransactionType.moneyAccountWithdraw,
    });

    expect(result.current.isMoneyNoFeeToken).toBe(true);
  });

  it('returns false for a non-subsidised token', () => {
    const { result } = renderUseMoneyNoFeeTokens({
      payTokenAddress: ETH_MUSD,
    });

    expect(result.current.isMoneyNoFeeToken).toBe(false);
  });

  it('returns false for non-money-account transactions', () => {
    const { result } = renderUseMoneyNoFeeTokens({
      type: TransactionType.perpsDeposit,
    });

    expect(result.current.isMoneyNoFeeToken).toBe(false);
  });

  it('returns false when the relay fixed-spread flag is empty', () => {
    const { result } = renderUseMoneyNoFeeTokens({
      remoteFeatureFlags: {},
    });

    expect(result.current.isMoneyNoFeeToken).toBe(false);
  });
});
