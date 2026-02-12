import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTokenInsightsData } from '../../../hooks/useTokenInsightsData';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import * as tokenInsightsUtils from '../../../helpers/utils/token-insights';
import { TokenInsightsModal } from './token-insights-modal';

jest.mock('../../../hooks/useTokenInsightsData');
jest.mock('../../../hooks/useI18nContext');
jest.mock('../../../components/multichain', () => ({
  AddressCopyButton: ({
    address,
    shorten,
  }: {
    address: string;
    shorten: boolean;
  }) => (
    <button data-testid="address-copy-button">
      {shorten ? `${address.slice(0, 6)}...${address.slice(-4)}` : address}
    </button>
  ),
}));

jest.mock('../../../helpers/utils/token-insights', () => ({
  formatPercentage: jest.fn((value: number) => `${value.toFixed(2)}%`),
  formatContractAddress: jest.fn((address: string) => address),
  shouldShowContractAddress: jest.fn(() => true),
  getPriceChangeColor: jest.fn((value: number) => {
    if (value > 0) {
      return 'success';
    }
    if (value < 0) {
      return 'error';
    }
    return 'default';
  }),
}));

const mockTrackEvent = jest.fn();
const mockT = (key: string) => key;

const defaultToken = {
  address: '0x1234567890123456789012345678901234567890',
  symbol: 'TEST',
  name: 'Test Token',
  chainId: '0x1',
  iconUrl: 'https://example.com/icon.png',
};

const defaultMarketData = {
  price: 100,
  pricePercentChange1d: 5.25,
  volume: 1000000,
  marketCap: 50000000,
};

const defaultMarketDataFiat = {
  formattedPrice: '$100.00',
  formattedVolume: '$1.00M',
  formattedMarketCap: '$50.00M',
};

describe('TokenInsightsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useI18nContext as jest.Mock).mockReturnValue(mockT);
    (useTokenInsightsData as jest.Mock).mockReturnValue({
      marketData: defaultMarketData,
      marketDataFiat: defaultMarketDataFiat,
      isLoading: false,
    });
    // Reset mock implementations
    (tokenInsightsUtils.shouldShowContractAddress as jest.Mock).mockReturnValue(
      true,
    );
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      token: defaultToken,
      ...props,
    };

    return render(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <TokenInsightsModal {...defaultProps} />
      </MetaMetricsContext.Provider>,
    );
  };

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderComponent();
      expect(screen.getByTestId('token-insights-icon')).toBeInTheDocument();
      expect(screen.getByText('TEST insights')).toBeInTheDocument();
      expect(screen.getByTestId('token-price')).toBeInTheDocument();
      expect(screen.getByTestId('token-price-change')).toBeInTheDocument();
      expect(screen.getByTestId('token-volume')).toBeInTheDocument();
      expect(screen.getByTestId('token-market-cap')).toBeInTheDocument();
      expect(screen.getByTestId('token-contract-address')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('5.25%')).toBeInTheDocument();
      expect(screen.getByText('$1.00M')).toBeInTheDocument();
      expect(screen.getByText('$50.00M')).toBeInTheDocument();
    });
  });

  describe('Price Change Display', () => {
    it('should show positive price change for positive price change', () => {
      renderComponent();
      const priceChangeRow = screen.getByTestId('token-price-change');
      expect(priceChangeRow).toHaveTextContent('5.25%');
      expect(tokenInsightsUtils.getPriceChangeColor).toHaveBeenCalledWith(5.25);
    });

    it('should show negative price change for negative price change', () => {
      (useTokenInsightsData as jest.Mock).mockReturnValue({
        marketData: {
          ...defaultMarketData,
          pricePercentChange1d: -3.75,
        },
        marketDataFiat: defaultMarketDataFiat,
        isLoading: false,
      });

      renderComponent();
      const priceChangeRow = screen.getByTestId('token-price-change');
      expect(priceChangeRow).toHaveTextContent('-3.75%');
      expect(tokenInsightsUtils.getPriceChangeColor).toHaveBeenCalledWith(
        -3.75,
      );
    });
  });

  describe('Contract Address', () => {
    it('should show contract address when shouldShowContractAddress returns true', () => {
      renderComponent();
      expect(screen.getByTestId('token-contract-address')).toBeInTheDocument();
      expect(
        screen.getByTestId('address-copy-button-text'),
      ).toBeInTheDocument();
    });

    it('should hide contract address when shouldShowContractAddress returns false', () => {
      (
        tokenInsightsUtils.shouldShowContractAddress as jest.Mock
      ).mockReturnValue(false);
      renderComponent();
      expect(
        screen.queryByTestId('token-contract-address'),
      ).not.toBeInTheDocument();
    });

    it('should track event when copying contract address', () => {
      renderComponent();
      const copyButton = screen.getByTestId('address-copy-button-text');
      fireEvent.click(copyButton);

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: 'Token Contract Address Copied',
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: 'TEST',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_address: '0x1234567890123456789012345678901234567890',
        },
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when clicking outside', async () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      // Simulate click outside the modal
      fireEvent.mouseDown(document.body);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside', () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      const modalContent = screen.getByTestId('token-price');
      fireEvent.mouseDown(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing price change data', () => {
      (useTokenInsightsData as jest.Mock).mockReturnValue({
        marketData: { ...defaultMarketData, pricePercentChange1d: undefined },
        marketDataFiat: defaultMarketDataFiat,
        isLoading: false,
      });

      renderComponent();
      expect(screen.getByTestId('token-price-change')).toHaveTextContent(
        '0.00%',
      );
    });

    it('should handle missing market data', () => {
      (useTokenInsightsData as jest.Mock).mockReturnValue({
        marketData: null,
        marketDataFiat: null,
        isLoading: false,
      });

      renderComponent();
      expect(screen.getByTestId('token-price')).toHaveTextContent('—');
      expect(screen.getByTestId('token-price-change')).toHaveTextContent(
        '0.00%',
      );
      expect(screen.getByTestId('token-volume')).toHaveTextContent('—');
      expect(screen.getByTestId('token-market-cap')).toHaveTextContent('—');
    });

    it('should handle token without icon URL', () => {
      const tokenWithoutIcon = { ...defaultToken, iconUrl: undefined };
      renderComponent({ token: tokenWithoutIcon });

      expect(screen.getByTestId('token-insights-icon')).toBeInTheDocument();
    });

    it('should handle token with only symbol (no name)', () => {
      const tokenWithOnlySymbol = { ...defaultToken, name: undefined };
      renderComponent({ token: tokenWithOnlySymbol });

      expect(screen.getByText('TEST insights')).toBeInTheDocument();
    });
  });
});
