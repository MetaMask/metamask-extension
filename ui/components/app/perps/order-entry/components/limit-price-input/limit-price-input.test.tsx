import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
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
    direction: 'long' as const,
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

      expect(
        screen.getByText(messages.perpsLimitPrice.message),
      ).toBeInTheDocument();
    });

    it('displays Mid button as end accessory', () => {
      renderWithProvider(<LimitPriceInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('limit-price-mid-button')).toBeInTheDocument();
      expect(screen.getByText(messages.perpsMid.message)).toBeInTheDocument();
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

      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith('45050');
    });
  });

  describe('locale handling', () => {
    it('keeps raw dot-decimal value in de locale', () => {
      const deStore = configureStore({
        localeMessages: {
          ...(mockState.localeMessages ?? {}),
          currentLocale: 'de',
        },
      });

      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          limitPrice="45050.00"
          onLimitPriceChange={defaultProps.onLimitPriceChange}
        />,
        deStore,
      );

      const container = screen.getByTestId('limit-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      expect(input).toHaveValue('45050.00');
      fireEvent.blur(input as HTMLInputElement);

      expect(defaultProps.onLimitPriceChange).toHaveBeenCalledWith('45050');
    });

    it('rejects non-en-US locale-formatted input while typing', () => {
      const onLimitPriceChange = jest.fn();
      const deStore = configureStore({
        localeMessages: {
          ...(mockState.localeMessages ?? {}),
          currentLocale: 'de',
        },
      });

      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          limitPrice=""
          onLimitPriceChange={onLimitPriceChange}
        />,
        deStore,
      );

      const container = screen.getByTestId('limit-price-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();

      fireEvent.focus(input as HTMLInputElement);
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '45.050,00' },
      });

      expect(onLimitPriceChange).not.toHaveBeenCalled();
    });
  });

  describe('limit price warnings', () => {
    it('shows warning when long limit price is above current price', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="long"
          limitPrice="46000"
        />,
        mockStore,
      );

      expect(screen.getByTestId('limit-price-warning')).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLimitPriceAboveCurrentPrice.message),
      ).toBeInTheDocument();
    });

    it('shows warning when short limit price is below current price', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="short"
          limitPrice="44000"
        />,
        mockStore,
      );

      expect(screen.getByTestId('limit-price-warning')).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLimitPriceBelowCurrentPrice.message),
      ).toBeInTheDocument();
    });

    it('does not show warning when long limit price is below current price', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="long"
          limitPrice="44000"
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('limit-price-warning'),
      ).not.toBeInTheDocument();
    });

    it('does not show warning when short limit price is above current price', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="short"
          limitPrice="46000"
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('limit-price-warning'),
      ).not.toBeInTheDocument();
    });

    it('does not show warning when limit price is empty', () => {
      renderWithProvider(
        <LimitPriceInput {...defaultProps} limitPrice="" />,
        mockStore,
      );

      expect(
        screen.queryByTestId('limit-price-warning'),
      ).not.toBeInTheDocument();
    });
  });

  describe('liquidation price warnings', () => {
    it('shows liquidation warning when current price is at or below liquidation price for long', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="long"
          limitPrice="44000"
          currentPrice={100}
          liquidationPrice={200}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('limit-price-liquidation-warning'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLimitPriceNearLiquidation.message),
      ).toBeInTheDocument();
    });

    it('shows liquidation warning when current price is at or above liquidation price for short', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="short"
          limitPrice="46000"
          currentPrice={500}
          liquidationPrice={400}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('limit-price-liquidation-warning'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLimitPriceNearLiquidation.message),
      ).toBeInTheDocument();
    });

    it('does not show liquidation warning when liquidation price is not provided', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="long"
          limitPrice="44000"
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('limit-price-liquidation-warning'),
      ).not.toBeInTheDocument();
    });

    it('does not show liquidation warning when current price is safely above liquidation for long', () => {
      renderWithProvider(
        <LimitPriceInput
          {...defaultProps}
          direction="long"
          limitPrice="44000"
          currentPrice={45250}
          liquidationPrice={40000}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('limit-price-liquidation-warning'),
      ).not.toBeInTheDocument();
    });
  });
});
