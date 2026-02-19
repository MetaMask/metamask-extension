import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { LimitPriceInput } from './limit-price-input';

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
    midPrice: 45050.0,
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

    it('displays Mid button as end accessory', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('limit-price-mid-button')).toBeInTheDocument();
      expect(screen.getByText('Mid')).toBeInTheDocument();
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

  describe('Mid button', () => {
    it('sets mid price when Mid button is clicked', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('limit-price-mid-button'));

      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith(
        expect.stringContaining('45,050'),
      );
    });
  });
});
