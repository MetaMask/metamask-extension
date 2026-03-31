import { screen, fireEvent } from '@testing-library/react';
import React from 'react';

import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import { AmountInput } from './amount-input';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('AmountInput', () => {
  const defaultProps = {
    amount: '',
    onAmountChange: jest.fn(),
    balancePercent: 0,
    onBalancePercentChange: jest.fn(),
    availableBalance: 10000,
    leverage: 1,
    asset: 'BTC',
    currentPrice: 45000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Size label and available to trade text', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText(messages.perpsSize.message)).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsAvailableToTrade.message),
      ).toBeInTheDocument();
      expect(screen.getByText(/USDC/u)).toBeInTheDocument();
    });

    it('renders the amount input field', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
    });

    it('renders the token amount input field', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(
        screen.getByTestId('amount-input-token-field'),
      ).toBeInTheDocument();
    });

    it('renders the slider', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });

    it('displays the $ prefix', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('displays percentage pill', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} balancePercent={25} />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('25');
      expect(screen.getByText('%')).toBeInTheDocument();
    });
  });

  describe('amount input', () => {
    it('displays entered amount', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} amount="1000" />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).toHaveValue('1000');
    });

    it('calls onAmountChange when input value changes', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '500' } });

      expect(onAmountChange).toHaveBeenCalledWith('500');
    });

    it('updates balance percent when amount changes', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: '500' } });

      expect(onBalancePercentChange).toHaveBeenCalledWith(50);
    });

    it('caps balance percent at 100%', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1500' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
    });

    it('rejects invalid input', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, { target: { value: 'abc' } });

      expect(onAmountChange).not.toHaveBeenCalled();
    });

    it('rejects numbers with comma grouping', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1,000' },
      });

      expect(onAmountChange).not.toHaveBeenCalled();
    });

    it('rejects non-en-US locale-formatted input', () => {
      const onAmountChange = jest.fn();
      const deLocaleStore = configureStore({
        metamask: {
          ...mockState.metamask,
        },
        localeMessages: {
          currentLocale: 'de',
        },
      });

      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        deLocaleStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.focus(input as HTMLInputElement);
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1.000,50' },
      });

      expect(onAmountChange).not.toHaveBeenCalled();
    });

    it('keeps raw dot-decimal value in de locale', () => {
      const deLocaleStore = configureStore({
        metamask: {
          ...mockState.metamask,
        },
        localeMessages: {
          currentLocale: 'de',
        },
      });

      renderWithProvider(
        <AmountInput {...defaultProps} amount="1000.50" />,
        deLocaleStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).toHaveValue('1000.50');
    });

    it('floors amount to 2 decimals on blur', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          amount="3.067"
          onAmountChange={onAmountChange}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.blur(input as HTMLInputElement);

      expect(onAmountChange).toHaveBeenCalledWith('3.06');
    });
  });

  describe('token input', () => {
    it('floors converted USD amount to 2 decimals', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          availableBalance={3.066}
          currentPrice={1}
          leverage={1}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '3.067' },
      });

      expect(onAmountChange).toHaveBeenCalledWith('3.06');
    });
  });

  describe('slider', () => {
    it('renders the slider container', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });
  });

  describe('percent input', () => {
    it('does not underflow at 100% for IEEE-754 edge values', () => {
      const onAmountChange = jest.fn();
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1.15}
        />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '100' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
      expect(onAmountChange).toHaveBeenCalledWith('1.15');
    });

    it('floors generated 100% amount to 2 decimals', () => {
      const onAmountChange = jest.fn();
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={3.066}
        />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '100' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
      expect(onAmountChange).toHaveBeenCalledWith('3.06');
    });

    it('floors clamped amount when percent input is above 100 on blur', () => {
      const onAmountChange = jest.fn();
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={3.066}
        />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '101' },
      });
      fireEvent.blur(input as HTMLInputElement);

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
      expect(onAmountChange).toHaveBeenCalledWith('3.06');
    });
  });
});
