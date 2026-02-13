import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { LimitPriceInput } from './limit-price-input';

// Mock hooks that depend on @metamask/perps-controller to avoid ESM transform issues
jest.mock('../../../../../../hooks/perps/useUserHistory', () => ({
  useUserHistory: () => ({
    userHistory: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../../../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: () => ({
    transactions: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('LimitPriceInput', () => {
  const defaultProps = {
    limitPrice: '',
    onLimitPriceChange: jest.fn(),
    currentPrice: 45250.0,
    direction: 'long' as const,
    midPrice: 45050.0,
    bidPrice: 45000.0,
    askPrice: 45100.0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the limit price input field', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('limit-price-input')).toBeInTheDocument();
    });

    it('displays the Limit Price label', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      expect(screen.getByText('Limit Price')).toBeInTheDocument();
    });

    it('displays long presets (Mid, Bid, -1%, -2%)', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} direction="long" />,
        mockStore,
      );

      expect(screen.getByText('Mid')).toBeInTheDocument();
      expect(screen.getByText('Bid')).toBeInTheDocument();
      expect(screen.getByText('-1%')).toBeInTheDocument();
      expect(screen.getByText('-2%')).toBeInTheDocument();
    });

    it('displays short presets (Mid, Ask, +1%, +2%)', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} direction="short" />,
        mockStore,
      );

      expect(screen.getByText('Mid')).toBeInTheDocument();
      expect(screen.getByText('Ask')).toBeInTheDocument();
      expect(screen.getByText('+1%')).toBeInTheDocument();
      expect(screen.getByText('+2%')).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    it('allows entering a decimal price', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      const container = screen.getByTestId('limit-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();

      fireEvent.change(input as HTMLInputElement, {
        target: { value: '45000.50' },
      });

      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith('45000.50');
    });

    it('rejects non-numeric input', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      const container = screen.getByTestId('limit-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();

      fireEvent.change(input as HTMLInputElement, {
        target: { value: 'abc' },
      });

      expect(defaultProps.onLimitPriceChange).not.toHaveBeenCalled();
    });

    it('allows clearing the input', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} limitPrice="45000" />,
        mockStore,
      );

      const container = screen.getByTestId('limit-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();

      fireEvent.change(input as HTMLInputElement, {
        target: { value: '' },
      });

      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith('');
    });
  });

  describe('preset buttons', () => {
    it('sets mid price when Mid preset is clicked (long)', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} direction="long" />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('limit-price-preset-Mid'));

      // Mid price from mock is 45050.00
      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith(
        expect.stringContaining('45,050'),
      );
    });

    it('sets bid price when Bid preset is clicked (long)', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} direction="long" />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('limit-price-preset-Bid'));

      // Bid price from mock is 45000.00
      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith(
        expect.stringContaining('45,000'),
      );
    });

    it('sets ask price when Ask preset is clicked (short)', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} direction="short" />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('limit-price-preset-Ask'));

      // Ask price from mock is 45100.00
      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith(
        expect.stringContaining('45,100'),
      );
    });
  });
});
