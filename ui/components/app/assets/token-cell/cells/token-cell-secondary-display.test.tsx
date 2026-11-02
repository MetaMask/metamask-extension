import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { TextAlign } from '../../../../../helpers/constants/design-system';
import type { TokenFiatDisplayInfo } from '../../types';
import { TokenCellSecondaryDisplay } from './token-cell-secondary-display';

jest.mock('../../../../../hooks/useIsOriginalNativeTokenSymbol', () => ({
  useIsOriginalNativeTokenSymbol: jest.fn(() => true),
}));

describe('TokenCellSecondaryDisplay', () => {
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
      <TokenCellSecondaryDisplay
        token={token}
        handleScamWarningModal={jest.fn()}
        privacyMode={false}
      />,
      store,
    );

    expect(
      getByTestId('multichain-token-list-item-secondary-value-skeleton'),
    ).toBeInTheDocument();
  });

  describe('text alignment', () => {
    const loadedToken = {
      ...token,
      secondary: 5,
      isFiatLoading: false,
    } as TokenFiatDisplayInfo;

    const renderValue = (textAlign?: TextAlign) =>
      renderWithProvider(
        <TokenCellSecondaryDisplay
          token={loadedToken}
          handleScamWarningModal={jest.fn()}
          privacyMode={false}
          textAlign={textAlign}
        />,
        store,
      ).getByTestId('multichain-token-list-item-secondary-value');

    it('aligns to the end with inline padding by default', () => {
      const value = renderValue();

      expect(value).toHaveClass('mm-text--text-align-end');
      expect(value).toHaveStyle({ paddingInlineStart: '8px' });
    });

    it('aligns to the end with inline padding when textAlign is End', () => {
      const value = renderValue(TextAlign.End);

      expect(value).toHaveClass('mm-text--text-align-end');
      expect(value).toHaveStyle({ paddingInlineStart: '8px' });
    });

    it('aligns left without inline padding when textAlign is Left', () => {
      const value = renderValue(TextAlign.Left);

      expect(value).toHaveClass('mm-text--text-align-left');
      expect(value).not.toHaveClass('mm-text--text-align-end');
      expect(value.style.paddingInlineStart).toBe('');
      expect(value).toHaveStyle({ whiteSpace: 'nowrap' });
    });
  });
});
