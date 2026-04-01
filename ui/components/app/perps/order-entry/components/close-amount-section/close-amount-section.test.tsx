import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
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
    it('renders position size and close amount labels', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(
        screen.getByText(messages.perpsAvailableToClose.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsCloseAmount.message),
      ).toBeInTheDocument();
    });

    it('displays total position size next to label', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={50} />,
        mockStore,
      );

      expect(screen.getByText(/2\.5.*BTC/u)).toBeInTheDocument();
      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /\$56,250/u,
      );
    });

    it('displays close amount USD based on percentage', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={75} />,
        mockStore,
      );

      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /\$84,375/u,
      );
    });

    it('displays close percentage in chip', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={100} />,
        mockStore,
      );

      expect(screen.getByText(/100.*%/u)).toBeInTheDocument();
    });

    it('renders the slider', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-slider')).toBeInTheDocument();
    });

    it('does not render preset percentage buttons', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(
        screen.queryByTestId('close-percent-preset-25'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('close-percent-preset-100'),
      ).not.toBeInTheDocument();
    });
  });

  describe('close amount calculations', () => {
    it('calculates 50% close USD value', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={50} />,
        mockStore,
      );

      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /\$56,250/u,
      );
      expect(screen.getByText(/50.*%/u)).toBeInTheDocument();
    });

    it('calculates 25% close USD value', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={25} />,
        mockStore,
      );

      expect(screen.getByTestId('close-amount-value')).toHaveTextContent(
        /\$28,125/u,
      );
    });

    it('handles negative position size (short)', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} positionSize="-2.5" />,
        mockStore,
      );

      const btcElements = screen.getAllByText(/2\.5.*BTC/u);
      expect(btcElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('handles zero position size', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} positionSize="0" />,
        mockStore,
      );

      const btcElements = screen.getAllByText(/0.*BTC/u);
      expect(btcElements.length).toBeGreaterThanOrEqual(1);
    });

    it('handles invalid position size', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} positionSize="invalid" />,
        mockStore,
      );

      const btcElements = screen.getAllByText(/0.*BTC/u);
      expect(btcElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
