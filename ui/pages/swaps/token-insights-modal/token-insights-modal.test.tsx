import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { TokenInsightsModal } from './token-insights-modal';

const mockStore = configureStore([]);

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../hooks/useTokenInsightsData', () => ({
  useTokenInsightsData: jest.fn(() => ({
    marketData: {
      price: 100,
      pricePercentChange1d: 5.5,
      totalVolume: 1000000,
      marketCap: 5000000,
    },
    isLoading: false,
    error: null,
    isVerified: true,
    aggregators: ['MetaMask', 'CoinGecko'],
    isNativeToken: false,
  })),
}));

jest.mock('../../../contexts/metametrics', () => ({
  MetaMetricsContext: React.createContext(() => {}),
}));

describe('TokenInsightsModal', () => {
  const mockOnClose = jest.fn();
  const mockToken = {
    address: '0x1234567890123456789012345678901234567890',
    symbol: 'TEST',
    name: 'Test Token',
    chainId: '0x1',
    iconUrl: 'https://example.com/icon.png',
  };

  const initialState = {
    metamask: {
      currentCurrency: 'USD',
    },
  };

  const renderComponent = (props = {}) => {
    const store = mockStore(initialState);
    return render(
      <Provider store={store}>
        <TokenInsightsModal
          isOpen={true}
          onClose={mockOnClose}
          token={mockToken}
          {...props}
        />
      </Provider>
    );
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render modal with token insights', () => {
    renderComponent();

    expect(screen.getByText('TEST insights')).toBeInTheDocument();
    expect(screen.getByText('Test Token')).toBeInTheDocument();
  });

  it('should show verified token badge', () => {
    renderComponent();

    expect(screen.getByTestId('verified-token-badge')).toBeInTheDocument();
    expect(screen.getByText('verifiedToken')).toBeInTheDocument();
  });

  it('should display market data', () => {
    renderComponent();

    expect(screen.getByTestId('token-price')).toBeInTheDocument();
    expect(screen.getByTestId('token-price-change')).toBeInTheDocument();
    expect(screen.getByTestId('token-volume')).toBeInTheDocument();
    expect(screen.getByTestId('token-market-cap')).toBeInTheDocument();
  });

  it('should show positive price change with up icon', () => {
    renderComponent();

    const priceChangeRow = screen.getByTestId('token-price-change');
    expect(priceChangeRow).toHaveTextContent('+5.50%');
  });

  it('should show contract address for non-native tokens', () => {
    renderComponent();

    expect(screen.getByTestId('token-contract-address')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    renderComponent();

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when data is loading', async () => {
    const useTokenInsightsData = require('../../../hooks/useTokenInsightsData').useTokenInsightsData;
    useTokenInsightsData.mockReturnValueOnce({
      marketData: null,
      isLoading: true,
      error: null,
      isVerified: false,
      aggregators: [],
      isNativeToken: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should not render when token is null', () => {
    const { container } = renderComponent({ token: null });
    expect(container.firstChild).toBeNull();
  });
});
