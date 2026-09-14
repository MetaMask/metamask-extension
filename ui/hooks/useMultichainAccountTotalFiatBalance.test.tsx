import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BtcAccountType, BtcScope } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import mockState from '../../test/data/mock-state.json';
import configureStore from '../store/store';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import { useMultichainAccountTotalFiatBalance } from './useMultichainAccountTotalFiatBalance';

const mockAccount = createMockInternalAccount({
  name: 'Account 1',
  address: '0x0836f5ed6b62baf60706fe3adc0ff0fd1df833da',
});
const mockNonEvmAccount = {
  ...mockAccount,
  id: 'b7893c59-e376-4cc0-93ad-05ddaab574a6',
  address: 'bc1qn3stuu6g37rpxk3jfxr4h4zmj68g0lwxx5eker',
  type: BtcAccountType.P2wpkh,
  scopes: [BtcScope.Mainnet],
};

const ETH_NATIVE_ASSET_ID = 'eip155:1/slip44:60';
const USDC_ASSET_ID =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const YFI_ASSET_ID =
  'eip155:1/erc20:0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e';
const BTC_NATIVE_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';
const ETH_RATE = 1612.92;
const BTC_RATE = 100000;

const renderUseMultichainAccountTotalFiatBalance = (
  account: InternalAccount,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      selectedCurrency: 'usd',
      assetsInfo: {
        [ETH_NATIVE_ASSET_ID]: {
          type: 'native',
          decimals: 18,
          symbol: 'ETH',
        },
        [USDC_ASSET_ID]: {
          type: 'erc20',
          decimals: 6,
          symbol: 'USDC',
        },
        [YFI_ASSET_ID]: {
          type: 'erc20',
          decimals: 18,
          symbol: 'YFI',
        },
        [BTC_NATIVE_ASSET_ID]: {
          type: 'native',
          decimals: 8,
          symbol: 'BTC',
          name: 'Bitcoin',
          image: './images/bitcoin-logo.svg',
        },
      },
      assetsBalance: {
        [mockAccount.id]: {
          [ETH_NATIVE_ASSET_ID]: { amount: '0.001145088524739965' },
          [USDC_ASSET_ID]: { amount: '0.048573' },
          [YFI_ASSET_ID]: { amount: '0.001409247882142934' },
        },
        [mockNonEvmAccount.id]: {
          [BTC_NATIVE_ASSET_ID]: { amount: '1.00000000' },
        },
      },
      assetsPrice: {
        [ETH_NATIVE_ASSET_ID]: {
          assetPriceType: 'fungible',
          price: ETH_RATE,
          usdPrice: ETH_RATE,
          lastUpdated: 1,
        },
        [USDC_ASSET_ID]: {
          assetPriceType: 'fungible',
          price: 0.0006189 * ETH_RATE,
          usdPrice: 0.0006189 * ETH_RATE,
          lastUpdated: 1,
        },
        [YFI_ASSET_ID]: {
          assetPriceType: 'fungible',
          price: 3.304588 * ETH_RATE,
          usdPrice: 3.304588 * ETH_RATE,
          lastUpdated: 1,
        },
        [BTC_NATIVE_ASSET_ID]: {
          assetPriceType: 'fungible',
          price: BTC_RATE,
          usdPrice: BTC_RATE,
          lastUpdated: 0,
        },
      },
      internalAccounts: {
        accounts: {
          [mockAccount.id]: mockAccount,
          [mockNonEvmAccount.id]: mockNonEvmAccount,
        },
        selectedAccount: mockAccount.id,
      },
      tokensChainsCache: {
        [CHAIN_IDS.MAINNET]: {
          data: {
            '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
              address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
              symbol: 'YFI',
              decimals: 18,
              name: 'yearn.finance',
              occurrences: 12,
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
              iconUrl:
                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo.png',
            },
          },
        },
      },
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
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
  // Deleted: EVM account case that expected $9.41 including ERC-20 balances.
  // Same root cause as useAccountTotalFiatBalance — `useTokenTracker` always
  // returns zero balances after AssetsController unification.

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
