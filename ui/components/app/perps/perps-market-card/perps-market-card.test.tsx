import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { PerpsMarketCard } from './perps-market-card';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

// Store with the perpsShowFullAssetNames flag enabled so full asset names render.
const mockStoreWithFullNames = configureStore({
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      perpsShowFullAssetNames: { enabled: true, minimumVersion: '0.0.0' },
    },
  },
});

const defaultProps = {
  symbol: 'BTC',
  name: messages.networkNameBitcoin.message,
  price: '$45,250.00',
  change24hPercent: '2.5',
  volume: '$1.2B',
  onClick: jest.fn(),
  'data-testid': 'perps-market-card-BTC',
};

describe('PerpsMarketCard', () => {
  it('renders the market card with the provided data-testid', () => {
    renderWithProvider(<PerpsMarketCard {...defaultProps} />, mockStore);

    expect(screen.getByTestId('perps-market-card-BTC')).toBeInTheDocument();
  });

  it('displays the full asset name when the flag is enabled', () => {
    renderWithProvider(
      <PerpsMarketCard {...defaultProps} />,
      mockStoreWithFullNames,
    );

    expect(
      screen.getByText(messages.networkNameBitcoin.message),
    ).toBeInTheDocument();
    expect(screen.queryByText('BTC')).not.toBeInTheDocument();
  });

  it('shows only the ticker when the full asset names flag is disabled', () => {
    renderWithProvider(<PerpsMarketCard {...defaultProps} />, mockStore);

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.networkNameBitcoin.message),
    ).not.toBeInTheDocument();
  });

  it('calls onClick with the symbol when clicked', () => {
    const onClick = jest.fn();
    renderWithProvider(
      <PerpsMarketCard {...defaultProps} onClick={onClick} />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('perps-market-card-BTC'));

    expect(onClick).toHaveBeenCalledWith('BTC');
  });
});
