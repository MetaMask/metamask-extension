import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import PerpsMarketDetailPage from './perps-market-detail-page';

const mockUseParams = jest.fn().mockReturnValue({ symbol: 'ETH' });

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useParams: () => mockUseParams(),
  };
});

describe('PerpsMarketDetailPage', () => {
  const store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.clearActions();
    jest.restoreAllMocks();
  });

  it('renders market detail page for ETH', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByTestId, getByText } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
    expect(getByText('ETH')).toBeInTheDocument();
  });

  it('renders market detail page for BTC', () => {
    mockUseParams.mockReturnValue({ symbol: 'BTC' });

    const { getByTestId, getByText } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
    expect(getByText('BTC')).toBeInTheDocument();
  });

  it('renders error state for unknown market', () => {
    mockUseParams.mockReturnValue({ symbol: 'UNKNOWN_MARKET' });

    const { getByText } = renderWithProvider(<PerpsMarketDetailPage />, store);

    expect(getByText('Market not found')).toBeInTheDocument();
    expect(getByText(/UNKNOWN_MARKET/)).toBeInTheDocument();
  });

  it('displays back button', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByTestId } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(getByTestId('perps-market-detail-back-button')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByTestId } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    const backButton = getByTestId('perps-market-detail-back-button');
    backButton.click();

    expect(mockUseNavigate).toHaveBeenCalledWith('/');
  });

  it('displays market price', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByTestId } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(getByTestId('perps-market-detail-price')).toBeInTheDocument();
  });

  it('displays market price change', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByTestId } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(getByTestId('perps-market-detail-change')).toBeInTheDocument();
  });

  it('displays chart placeholder', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByTestId, getByText } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(
      getByTestId('perps-market-detail-chart-placeholder'),
    ).toBeInTheDocument();
    expect(getByText('Chart coming soon')).toBeInTheDocument();
  });

  it('displays position card when user has a position', () => {
    mockUseParams.mockReturnValue({ symbol: 'ETH' });

    const { getByText } = renderWithProvider(<PerpsMarketDetailPage />, store);

    expect(getByText('Your Position')).toBeInTheDocument();
  });

  it('renders HIP-3 equity market (TSLA)', () => {
    mockUseParams.mockReturnValue({ symbol: 'xyz:TSLA' });

    const { getByTestId, getByText } = renderWithProvider(
      <PerpsMarketDetailPage />,
      store,
    );

    expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
    // Should display the stripped name "TSLA" not "xyz:TSLA"
    expect(getByText('TSLA')).toBeInTheDocument();
  });
});
