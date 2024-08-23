import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { BtcAccountType, InternalAccount } from '@metamask/keyring-api';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import { useMultichainAccountTotalFiatBalance } from './useMultichainAccountTotalFiatBalance';

const mockTokenBalances = [
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    balance: '48573',
    balanceError: null,
    decimals: 6,
    image: undefined,
    isERC721: undefined,
    string: '0.04857',
    symbol: 'USDC',
  },
  {
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    symbol: 'YFI',
    balance: '1409247882142934',
    decimals: 18,
    string: '0.001409247882142934',
    balanceError: null,
  },
];

jest.mock('./useTokenTracker', () => {
  return {
    useTokenTracker: () => ({
      loading: false,
      tokensWithBalances: mockTokenBalances,
      error: null,
    }),
  };
});

const mockAccount = createMockInternalAccount({
  name: 'Account 1',
  address: '0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da',
});
const mockNonEvmAccount = {
  ...mockAccount,
  id: 'b7893c59-e376-4cc0-93ad-05ddaab574a6',
  address: 'bc1qn3stuu6g37rpxk3jfxr4h4zmj68g0lwxx5eker',
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
          [mockNonEvmAccount.id]: mockNonEvmAccount,
        },
        selectedAccount: mockAccount.id,
      },
      balances: {
        [mockNonEvmAccount.id]: {
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
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

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
  it('return uses useAccountTotalFiatBalance if the an EVM account is passed', () => {
    const { result } = renderUseMultichainAccountTotalFiatBalance(mockAccount);

    expect(result.current).toStrictEqual({
      formattedFiat: '$9.41',
      loading: false,
      totalWeiBalance: '14ba1e6a08a9ed',
      tokensWithBalances: mockTokenBalances,
      totalFiatBalance: '9.41',
      orderedTokenList: [
        {
          fiatBalance: '1.85',
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
        },
        {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          aggregators: [
            'airswapLight',
            'bancor',
            'cmc',
            'coinGecko',
            'kleros',
            'oneInch',
            'paraswap',
            'pmm',
            'totle',
            'zapper',
            'zerion',
            'zeroEx',
          ],
          balance: '1409247882142934',
          balanceError: null,
          decimals: 18,
          fiatBalance: '0.05',
          iconUrl:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo.png',
          name: 'yearn.finance',
          occurrences: 12,
          string: '0.001409247882142934',
          symbol: 'YFI',
        },
      ],
    });
  });

  it('returns the total fiat balance for a non-EVM account', () => {
    const { result } =
      renderUseMultichainAccountTotalFiatBalance(mockNonEvmAccount);

    expect(result.current).toStrictEqual({
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
      totalBalance: '1.00000000',
    });
  });
});
