import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { BtcAccountType, InternalAccount } from '@metamask/keyring-api';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { CHAIN_IDS } from '../../shared/constants/network';
import {
  useMultichainAccountTotalFiatBalance,
  EMPTY_VALUES,
} from './useMultichainAccountTotalFiatBalance';

const mockAccount = createMockInternalAccount();
const mockNonEVMAccount = {
  ...mockAccount,
  id: 'b7893c59-e376-4cc0-93ad-05ddaab574a6',
  addres: 'bc1qn3stuu6g37rpxk3jfxr4h4zmj68g0lwxx5eker',
  type: BtcAccountType.P2wpkh,
};

const renderUseMultichainAccountTotalFiatBalance = (
  account: InternalAccount,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      internalAccounts: {
        accounts: {
          [mockAccount.id]: mockAccount,
          [mockNonEVMAccount.id]: mockNonEVMAccount,
        },
        selectedAccount: mockAccount.id,
      },
      balances: {
        [mockNonEVMAccount.id]: {
          'bip122:000000000019d6689c085ae165831e93/slip44:0': {
            amount: '1.00000000',
            unit: 'BTC',
          },
        },
      },
      rates: {
        btc: {
          conversionDate: 0,
          conversionRate: '100000',
        },
      },
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionRate: 1612.92,
        },
      },
      marketData: {
        [CHAIN_IDS.MAINNET]: {
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { price: 0.0006189 },
          '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': { price: 3.304588 },
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          '0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da': {
            balance: '0x041173b2c0e57d',
          },
          '0xd8ad671f1fcc94bcf0ebc6ec4790da35e8d5e1e1': {
            balance: '0x048010d1739513',
          },
        },
      },
      providerConfig: {
        chainId: CHAIN_IDS.MAINNET,
        ticker: 'ETH',
      },
      detectedTokens: {
        '0x1': {
          '0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da': [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              decimals: 6,
              symbol: 'USDC',
            },
            {
              address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
              aggregators: [],
              decimals: 18,
              name: 'yearn.finance',
              symbol: 'YFI',
            },
          ],
        },
      },
    },
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={configureStore(state)}>{children}</Provider>
  );

  return renderHook(() => useMultichainAccountTotalFiatBalance(account), {
    wrapper,
  });
};

describe('useMultichainAccountTotalFiatBalance', () => {
  it('return empty values if the an EVM account is passed', () => {
    const { result } = renderUseMultichainAccountTotalFiatBalance(mockAccount);

    expect(result.current).toStrictEqual(EMPTY_VALUES);
  });

  it('returns the total fiat balance for a non-EVM account', () => {
    const { result } =
      renderUseMultichainAccountTotalFiatBalance(mockNonEVMAccount);

    expect(result.current).toStrictEqual({
      error: null,
      formattedFiat: '$100,000.00',
      loading: false,
      orderedTokenList: [
        {
          fiatBalance: '100000',
          iconUrl: './images/bitcoin-logo.svg',
          symbol: 'BTC',
        },
      ],
      tokensWithBalances: [],
      totalFiatBalance: '100000',
    });
  });
});
