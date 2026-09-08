import React from 'react';
import { screen } from '@testing-library/react';
import type { Position } from '@metamask/perps-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { usePerpsPositionForAsset } from '../../../hooks/perps/usePerpsPositionForAsset';
import { AssetPerpsPositionSection } from './asset-perps-position-section';

jest.mock('../../../hooks/perps/usePerpsPositionForAsset', () => ({
  usePerpsPositionForAsset: jest.fn(),
}));

jest.mock('../../../components/app/perps/perps-view-stream-boundary', () => ({
  PerpsViewStreamBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../../../components/app/perps/position-card', () => ({
  PositionCard: ({
    position,
    assetName,
  }: {
    position: Position;
    assetName?: string;
  }) => <div data-testid={`position-card-${position.symbol}`}>{assetName}</div>,
}));

const mockUsePerpsPositionForAsset = jest.mocked(usePerpsPositionForAsset);

const store = configureStore({ metamask: { ...mockState.metamask } });

const ETH_POSITION = { symbol: 'ETH' } as Position;

function renderSection() {
  return renderWithProvider(
    <AssetPerpsPositionSection marketSymbol="ETH" assetName="Ethereum" />,
    store,
  );
}

describe('AssetPerpsPositionSection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the open position for the market', () => {
    mockUsePerpsPositionForAsset.mockReturnValue({
      position: ETH_POSITION,
      isLoading: false,
    });

    renderSection();

    expect(
      screen.getByTestId('asset-perps-position-section'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('position-card-ETH')).toHaveTextContent(
      'Ethereum',
    );
    expect(screen.queryByTestId('perps-card-skeleton')).not.toBeInTheDocument();
  });

  it('renders a skeleton while the position lookup is loading', () => {
    mockUsePerpsPositionForAsset.mockReturnValue({
      position: undefined,
      isLoading: true,
    });

    renderSection();

    expect(screen.getByTestId('perps-card-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('position-card-ETH')).not.toBeInTheDocument();
  });

  it('renders nothing when the account has no position on the market', () => {
    mockUsePerpsPositionForAsset.mockReturnValue({
      position: undefined,
      isLoading: false,
    });

    renderSection();

    expect(
      screen.queryByTestId('asset-perps-position-section'),
    ).not.toBeInTheDocument();
  });
});
