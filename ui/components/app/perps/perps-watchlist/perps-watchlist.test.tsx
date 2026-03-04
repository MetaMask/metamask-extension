import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { mockCryptoMarkets } from '../mocks';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';
import { PerpsWatchlist } from './perps-watchlist';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketData: () => ({
    cryptoMarkets: mockCryptoMarkets,
    hip3Markets: [],
    isInitialLoading: false,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsWatchlist', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the watchlist section', () => {
    renderWithProvider(<PerpsWatchlist />, mockStore);

    expect(screen.getByTestId('perps-watchlist')).toBeInTheDocument();
  });

  it('displays the watchlist heading', () => {
    renderWithProvider(<PerpsWatchlist />, mockStore);

    expect(screen.getByText(/watchlist/iu)).toBeInTheDocument();
  });

  it('renders market cards for watchlist symbols (BTC, ETH) that exist in market data', () => {
    renderWithProvider(<PerpsWatchlist />, mockStore);

    expect(screen.getByTestId('perps-watchlist-BTC')).toBeInTheDocument();
    expect(screen.getByTestId('perps-watchlist-ETH')).toBeInTheDocument();
  });

  it('displays market name and price for each watchlist item', () => {
    renderWithProvider(<PerpsWatchlist />, mockStore);

    expect(screen.getByText(tEn('networkNameBitcoin'))).toBeInTheDocument();
    expect(screen.getByText(tEn('networkNameEthereum'))).toBeInTheDocument();
    expect(screen.getByText('$45,250.00')).toBeInTheDocument();
    expect(screen.getByText('$3,025.50')).toBeInTheDocument();
  });

  it('navigates to market detail when a watchlist card is clicked', () => {
    renderWithProvider(<PerpsWatchlist />, mockStore);

    fireEvent.click(screen.getByTestId('perps-watchlist-ETH'));

    expect(mockNavigate).toHaveBeenCalledWith(
      `${PERPS_MARKET_DETAIL_ROUTE}/ETH`,
    );
  });
});
