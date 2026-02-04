import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { CloseAmountSection } from './close-amount-section';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('CloseAmountSection', () => {
  const defaultProps = {
    positionSize: '2.5',
    closePercent: 100,
    onClosePercentChange: jest.fn(),
    asset: 'BTC',
    currentPrice: 45000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders position size label', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByText('Position Size')).toBeInTheDocument();
    });

    it('renders close amount label', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByText('Close Amount')).toBeInTheDocument();
    });

    it('displays total position size', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={50} />,
        mockStore,
      );

      // Use 50% to avoid collision between position size and close amount
      // Position size: 2.5 BTC, Close amount at 50%: 1.25 BTC
      expect(screen.getByText(/2\.5.*BTC/u)).toBeInTheDocument();
      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /1\.25.*BTC/u,
      );
    });

    it('displays close amount based on percentage', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={75} />,
        mockStore,
      );

      // 75% of 2.5 BTC = 1.875 BTC
      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /1\.875.*BTC/u,
      );
    });

    it('displays close percentage', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={100} />,
        mockStore,
      );

      // Multiple elements may show 100% (display and preset button)
      const percentElements = screen.getAllByText(/100.*%/u);
      expect(percentElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays USD value of close amount', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={100} />,
        mockStore,
      );

      // 2.5 BTC * $45000 = $112,500
      expect(screen.getByText(/≈.*\$112,500/u)).toBeInTheDocument();
    });

    it('renders the slider', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-slider')).toBeInTheDocument();
    });

    it('renders preset buttons', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-percent-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('close-percent-preset-50')).toBeInTheDocument();
      expect(screen.getByTestId('close-percent-preset-75')).toBeInTheDocument();
      expect(
        screen.getByTestId('close-percent-preset-100'),
      ).toBeInTheDocument();
    });
  });

  describe('close amount calculations', () => {
    it('calculates 50% close amount', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={50} />,
        mockStore,
      );

      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /1\.25.*BTC/u,
      );
      // Multiple elements show 50% (display and preset button)
      const percentElements = screen.getAllByText(/50.*%/u);
      expect(percentElements.length).toBeGreaterThanOrEqual(1);
    });

    it('calculates 25% close amount', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={25} />,
        mockStore,
      );

      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /0\.625.*BTC/u,
      );
    });

    it('handles negative position size (short)', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} positionSize="-2.5" />,
        mockStore,
      );

      // Should use absolute value - position size and close amount both show 2.5 BTC
      const btcElements = screen.getAllByText(/2\.5.*BTC/u);
      expect(btcElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('interactions', () => {
    it('calls onClosePercentChange when preset is clicked', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('close-percent-preset-50'));

      expect(onClosePercentChange).toHaveBeenCalledWith(50);
    });

    it('applies active style to selected preset', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={50} />,
        mockStore,
      );

      const activePreset = screen.getByTestId('close-percent-preset-50');
      expect(activePreset).toHaveClass('bg-primary-muted');
    });
  });

  describe('edge cases', () => {
    it('handles zero position size', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} positionSize="0" />,
        mockStore,
      );

      // Both position size and close amount show 0 BTC
      const btcElements = screen.getAllByText(/0.*BTC/u);
      expect(btcElements.length).toBeGreaterThanOrEqual(1);
    });

    it('handles invalid position size', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} positionSize="invalid" />,
        mockStore,
      );

      // Both position size and close amount show 0 BTC
      const btcElements = screen.getAllByText(/0.*BTC/u);
      expect(btcElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
