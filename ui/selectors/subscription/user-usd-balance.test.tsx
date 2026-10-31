import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import mockState from '../../../test/data/mock-state.json';
import configureStore from '../../store/store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { useAccountTotalFiatBalance } from '../../hooks/useAccountTotalFiatBalance';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../multichain-accounts/account-tree';
import type { MetaMaskReduxState } from '../../store/types';
import { getSelectedEvmAccountUsdBalance } from './user-usd-balance';

const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

function buildState(): MetaMaskReduxState {
  const baseState = mockState as unknown as MetaMaskReduxState;
  const account = getInternalAccountBySelectedAccountGroupAndCaip(
    baseState,
    'eip155:1',
  );
  if (!account) {
    throw new Error('mock state has no selected EVM account');
  }

  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currentCurrency: 'usd',
      enabledNetworkMap: { eip155: { [CHAIN_IDS.MAINNET]: true } },
      currencyRates: {
        ETH: { conversionRate: 1612.92, usdConversionRate: 1612.92 },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          [account.address.toLowerCase()]: { balance: '0x041173b2c0e57d' },
        },
      },
      allTokens: {
        [CHAIN_IDS.MAINNET]: {
          [account.address]: [
            {
              address: tokenAddress,
              aggregators: [],
              decimals: 6,
              symbol: 'USDC',
            },
          ],
        },
      },
      marketData: {
        [CHAIN_IDS.MAINNET]: { [tokenAddress]: { price: 0.0006189 } },
      },
      tokenBalances: {
        [account.address]: {
          [CHAIN_IDS.MAINNET]: { [tokenAddress]: '0x5f5e100' },
        },
      },
    },
  } as unknown as MetaMaskReduxState;
}

describe('getSelectedEvmAccountUsdBalance', () => {
  it('returns the USD value of the selected EVM account balance', () => {
    expect(getSelectedEvmAccountUsdBalance(buildState())).toBe('1.85');
  });

  it('matches the totalFiatBalance of useAccountTotalFiatBalance', () => {
    const state = buildState();
    const account = getInternalAccountBySelectedAccountGroupAndCaip(
      state,
      'eip155:1',
    );
    const { result } = renderHook(
      () => useAccountTotalFiatBalance(account, false, true),
      {
        wrapper: ({ children }) => (
          <Provider store={configureStore(state)}>{children}</Provider>
        ),
      },
    );

    expect(getSelectedEvmAccountUsdBalance(state)).toBe(
      result.current.totalFiatBalance,
    );
  });

  it('returns "0" when there is no selected account group', () => {
    const state = buildState();
    const withoutGroup = {
      ...state,
      metamask: {
        ...state.metamask,
        selectedAccountGroup: '',
      },
    } as unknown as MetaMaskReduxState;

    expect(getSelectedEvmAccountUsdBalance(withoutGroup)).toBe('0');
  });
});
