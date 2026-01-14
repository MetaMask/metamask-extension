import React from 'react';
import { screen } from '@testing-library/react';
import { AvatarTokenSize } from '@metamask/design-system-react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { HYPERLIQUID_ASSET_ICONS_BASE_URL } from '../constants';
import { PerpsTokenLogo } from './perps-token-logo';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsTokenLogo', () => {
  it('renders the token logo with correct data-testid', () => {
    renderWithProvider(<PerpsTokenLogo symbol="BTC" />, mockStore);

    expect(screen.getByTestId('perps-token-logo-BTC')).toBeInTheDocument();
  });

  it('renders with regular symbol', () => {
    renderWithProvider(<PerpsTokenLogo symbol="ETH" />, mockStore);

    expect(screen.getByTestId('perps-token-logo-ETH')).toBeInTheDocument();
  });

  it('renders with HIP-3 prefixed symbol', () => {
    renderWithProvider(<PerpsTokenLogo symbol="xyz:TSLA" />, mockStore);

    expect(screen.getByTestId('perps-token-logo-xyz:TSLA')).toBeInTheDocument();
  });

  it('uses the correct icon URL for regular assets', () => {
    renderWithProvider(<PerpsTokenLogo symbol="BTC" />, mockStore);

    const avatar = screen.getByTestId('perps-token-logo-BTC');
    const img = avatar.querySelector('img');
    expect(img).toHaveAttribute(
      'src',
      `${HYPERLIQUID_ASSET_ICONS_BASE_URL}BTC.svg`,
    );
  });

  it('uses the correct icon URL for HIP-3 assets', () => {
    renderWithProvider(<PerpsTokenLogo symbol="xyz:AAPL" />, mockStore);

    const avatar = screen.getByTestId('perps-token-logo-xyz:AAPL');
    const img = avatar.querySelector('img');
    expect(img).toHaveAttribute(
      'src',
      `${HYPERLIQUID_ASSET_ICONS_BASE_URL}xyz:AAPL.svg`,
    );
  });

  it('displays the symbol name as fallback', () => {
    renderWithProvider(<PerpsTokenLogo symbol="BTC" />, mockStore);

    const avatar = screen.getByTestId('perps-token-logo-BTC');
    expect(avatar).toBeInTheDocument();
  });

  it('displays extracted symbol name for HIP-3 assets', () => {
    renderWithProvider(<PerpsTokenLogo symbol="xyz:TSLA" />, mockStore);

    const avatar = screen.getByTestId('perps-token-logo-xyz:TSLA');
    expect(avatar).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderWithProvider(
      <PerpsTokenLogo symbol="BTC" className="custom-logo-class" />,
      mockStore,
    );

    const avatar = screen.getByTestId('perps-token-logo-BTC');
    expect(avatar).toHaveClass('custom-logo-class');
  });

  it('renders with default size when not specified', () => {
    renderWithProvider(<PerpsTokenLogo symbol="ETH" />, mockStore);

    // Component should render without errors with default size
    expect(screen.getByTestId('perps-token-logo-ETH')).toBeInTheDocument();
  });

  it('renders with specified size', () => {
    renderWithProvider(
      <PerpsTokenLogo symbol="SOL" size={AvatarTokenSize.Lg} />,
      mockStore,
    );

    expect(screen.getByTestId('perps-token-logo-SOL')).toBeInTheDocument();
  });
});

