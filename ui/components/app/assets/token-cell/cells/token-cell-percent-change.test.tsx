import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import type { TokenFiatDisplayInfo } from '../../types';
import { TokenCellPercentChange } from './token-cell-percent-change';

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
});
