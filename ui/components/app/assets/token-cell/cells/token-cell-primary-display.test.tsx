import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TextAlign } from '../../../../../helpers/constants/design-system';
import type { TokenFiatDisplayInfo } from '../../types';
import { TokenCellPrimaryDisplay } from './token-cell-primary-display';

describe('TokenCellPrimaryDisplay', () => {
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
  } as TokenFiatDisplayInfo;

  const renderValue = (textAlign?: TextAlign) =>
    renderWithProvider(
      <TokenCellPrimaryDisplay
        token={token}
        privacyMode={false}
        textAlign={textAlign}
      />,
      store,
    ).getByTestId('multichain-token-list-item-value');

  it('renders the formatted token quantity', () => {
    expect(renderValue()).toHaveTextContent('5 TEST');
  });

  it('aligns to the end by default', () => {
    expect(renderValue()).toHaveClass('mm-text--text-align-end');
  });

  it('aligns to the end when textAlign is End', () => {
    expect(renderValue(TextAlign.End)).toHaveClass('mm-text--text-align-end');
  });

  it('aligns left when textAlign is Left', () => {
    const value = renderValue(TextAlign.Left);

    expect(value).toHaveClass('mm-text--text-align-left');
    expect(value).not.toHaveClass('mm-text--text-align-end');
  });
});
