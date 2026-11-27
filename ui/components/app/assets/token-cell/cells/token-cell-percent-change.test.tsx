import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import type { TokenFiatDisplayInfo } from '../../types';
import { TokenCellPercentChange } from './token-cell-percent-change';

jest.mock('../../../../../../shared/lib/token-price', () => ({
  getCachedPercentChange: jest.fn(() => 9.99),
}));

describe('TokenCellPercentChange', () => {
  const store = configureMockStore([thunk])(mockState);

  const token = {
    address: '0xAnotherToken',
    symbol: 'TEST',
    image: '',
    decimals: 18,
    chainId: '0x1',
    title: 'TEST',
    tokenImage: '',
    tokenChainImage: '',
    secondary: null,
    balance: '5',
    isFiatLoading: true,
  } as TokenFiatDisplayInfo;

  it('shows a skeleton while fiat value is loading', () => {
    const { getByTestId } = renderWithProvider(
      <TokenCellPercentChange token={token} />,
      store,
    );

    expect(
      getByTestId('multichain-token-list-item-percentage-skeleton'),
    ).toBeInTheDocument();
  });

  it('uses the locked percent instead of the cached market-data change', () => {
    const loaded = { ...token, isFiatLoading: false };
    const { getByTestId } = renderWithProvider(
      <TokenCellPercentChange token={loaded} explicitPercentChange={1.8} />,
      store,
    );

    expect(
      getByTestId(`token-increase-decrease-percentage-${loaded.address}`),
    ).toHaveTextContent('+1.80%');
  });

  it('shows no percent when the locked change is absent', () => {
    const loaded = { ...token, isFiatLoading: false };
    const { getByTestId } = renderWithProvider(
      <TokenCellPercentChange token={loaded} explicitPercentChange={null} />,
      store,
    );

    expect(
      getByTestId(`token-increase-decrease-percentage-${loaded.address}`),
    ).toHaveTextContent('-');
  });
});
