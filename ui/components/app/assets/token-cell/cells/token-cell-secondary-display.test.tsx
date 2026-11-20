import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useIsOriginalNativeTokenSymbol } from '../../../../../hooks/useIsOriginalNativeTokenSymbol';
import type { TokenFiatDisplayInfo } from '../../types';
import { TokenCellSecondaryDisplay } from './token-cell-secondary-display';

jest.mock('../../../../../hooks/useIsOriginalNativeTokenSymbol', () => ({
  useIsOriginalNativeTokenSymbol: jest.fn(() => true),
}));

describe('TokenCellSecondaryDisplay', () => {
  const store = configureMockStore([thunk])(mockState);
  const mockUseIsOriginalNativeTokenSymbol = jest.mocked(
    useIsOriginalNativeTokenSymbol,
  );

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

  beforeEach(() => {
    mockUseIsOriginalNativeTokenSymbol.mockReturnValue(true);
  });

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

  it('shows a skeleton while the native symbol validation is loading', () => {
    mockUseIsOriginalNativeTokenSymbol.mockReturnValue(undefined);

    const { getByTestId, queryByTestId } = renderWithProvider(
      <TokenCellSecondaryDisplay
        token={{ ...token, isNative: true, isFiatLoading: false }}
        handleScamWarningModal={jest.fn()}
        privacyMode={false}
      />,
      store,
    );

    expect(
      getByTestId('multichain-token-list-item-secondary-value-skeleton'),
    ).toBeInTheDocument();
    expect(queryByTestId('scam-warning')).not.toBeInTheDocument();
  });

  it('shows the warning after a native symbol mismatch is confirmed', () => {
    mockUseIsOriginalNativeTokenSymbol.mockReturnValue(false);

    const { getByTestId } = renderWithProvider(
      <TokenCellSecondaryDisplay
        token={{ ...token, isNative: true, isFiatLoading: false }}
        handleScamWarningModal={jest.fn()}
        privacyMode={false}
      />,
      store,
    );

    expect(getByTestId('scam-warning')).toBeInTheDocument();
  });
});
