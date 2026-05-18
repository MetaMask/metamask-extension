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
  });

  describe('HIP-3 symbol display', () => {
    it('strips the dex prefix from HIP-3 asset symbols in the token input label', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} asset="xyz:BRENTOIL" />,
        mockStore,
      );

      expect(screen.getByText('BRENTOIL')).toBeInTheDocument();
      expect(screen.queryByText('xyz:BRENTOIL')).not.toBeInTheDocument();
    });
  });

  describe('token display', () => {
    it('displays token amount as size divided by price (not multiplied by leverage)', () => {
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          amount="9000"
          leverage={10}
          currentPrice={45000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input');
      // Size $9000 / price $45000 = 0.2 BTC (not 0.2 × 10 = 2)
      expect(input).toHaveValue('0.2');
    });
  });

  describe('leveraged size calculations', () => {
    it('computes balance percent using max size (available × leverage)', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
          leverage={10}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      // Size $5000 with available $1000 × 10x leverage = max size $10000
      // So $5000 / $10000 = 50%
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '5000' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(50);
    });

    it('caps percent at 100% when size exceeds max leveraged size', () => {
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
          leverage={5}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      // Max size = $1000 × 5 = $5000. Entering $6000 should cap at 100%
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '6000' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
    });
  });

  describe('token input', () => {
    it('converts token amount to USD size and updates percent', () => {
      const onAmountChange = jest.fn();
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
          leverage={5}
          currentPrice={50000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input');
      // 0.1 BTC × $50000 = $5000 size
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '0.1' },
      });

      // USD = tokens × price = $5000
      expect(onAmountChange).toHaveBeenCalledWith('5000.00');
      // Percent = $5000 / ($1000 × 5) = 100%
      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
    });

    it('rejects non-numeric token input', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput {...defaultProps} onAmountChange={onAmountChange} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: 'abc' },
      });

      expect(onAmountChange).not.toHaveBeenCalled();
    });

    it('preserves leading "0" in the field while the user continues typing', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          currentPrice={45000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);

      // Step 1: type "0" — partial; USD clears but field keeps "0"
      fireEvent.change(input, { target: { value: '0' } });
      expect(input).toHaveValue('0');
      expect(onAmountChange).toHaveBeenLastCalledWith('');

      // Step 2: type "0." — field keeps "0."
      fireEvent.change(input, { target: { value: '0.' } });
      expect(input).toHaveValue('0.');

      // Step 3: type "0.5" — field shows "0.5" and USD is computed
      fireEvent.change(input, { target: { value: '0.5' } });
      expect(input).toHaveValue('0.5');
      // 0.5 × 45000 = 22500
      expect(onAmountChange).toHaveBeenLastCalledWith('22500.00');
    });

    it('clears USD when the token field is backspaced to empty', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          currentPrice={50000}
        />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.focus(input);
      // Enter a valid token amount
      fireEvent.change(input, { target: { value: '0.1' } });
      expect(onAmountChange).toHaveBeenLastCalledWith('5000.00');

      // Clear the field
      fireEvent.change(input, { target: { value: '' } });
      expect(input).toHaveValue('');
      expect(onAmountChange).toHaveBeenLastCalledWith('');
    });

    it('shows un-grouped value for large token amounts so backspace edits work', () => {
      // 450000 USDC / price 1 = 450000 tokens
      // Without useGrouping:false this would be "450,000" which isUnsignedDecimalInput rejects
      renderWithProvider(
        <AmountInput {...defaultProps} amount="450000" currentPrice={1} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input');
      // Must not contain a comma — value must be plain digits
      expect(input?.value).not.toContain(',');
      expect(input).toHaveValue('450000');
    });

    it('syncs token field from external amount change when not editing', () => {
      const { rerender } = renderWithProvider(
        <AmountInput {...defaultProps} amount="" currentPrice={50000} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input');
      expect(input).toHaveValue('');

      // Simulate external update (e.g. slider or USD field changed amount)
      rerender(
        <AmountInput {...defaultProps} amount="5000" currentPrice={50000} />,
      );

      // 5000 / 50000 = 0.1
      expect(input).toHaveValue('0.1');
    });
  });

  describe('percent input', () => {
    it('sets amount from percent using leveraged max size', () => {
      const onAmountChange = jest.fn();
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
          leverage={8}
        />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      // 50% of ($1000 × 8) = 50% of $8000 = $4000
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '50' },
      });

      expect(onBalancePercentChange).toHaveBeenCalledWith(50);
      expect(onAmountChange).toHaveBeenCalledWith('4000.00');
    });

    it('clears amount when percent changes to 0', () => {
      const onAmountChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          availableBalance={1000}
          leverage={5}
          balancePercent={50}
        />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      fireEvent.change(input as HTMLInputElement, { target: { value: '0' } });

      expect(onAmountChange).toHaveBeenCalledWith('');
    });

    it('clamps to max leveraged size on blur when percent exceeds 100', () => {
      const onAmountChange = jest.fn();
      const onBalancePercentChange = jest.fn();
      renderWithProvider(
        <AmountInput
          {...defaultProps}
          onAmountChange={onAmountChange}
          onBalancePercentChange={onBalancePercentChange}
          availableBalance={1000}
          leverage={4}
        />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input');
      // Type 150 then blur — triggers clamp to 100
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '150' },
      });
      fireEvent.blur(input as HTMLInputElement);

      expect(onBalancePercentChange).toHaveBeenCalledWith(100);
      // 100% of ($1000 × 4) = $4000
      expect(onAmountChange).toHaveBeenCalledWith('4000.00');
    });
  });

  describe('slider', () => {
    it('renders the slider container', () => {
      renderWithProvider(<AmountInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('amount-slider')).toBeInTheDocument();
    });
  });

  describe('auto-focus and select-all', () => {
    it('auto-focuses the USD input when autoFocus is true', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} autoFocus />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).toHaveFocus();
    });

    it('does not auto-focus the USD input when autoFocus is false', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} autoFocus={false} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toHaveFocus();
    });

    it('selects existing USD value on focus', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} amount="123.45" />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input') as HTMLInputElement;
      const selectSpy = jest.spyOn(input, 'select');
      fireEvent.focus(input);
      expect(selectSpy).toHaveBeenCalled();
    });

    it('selects existing token value after focus switches to editing mode', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} amount="9000" currentPrice={45000} />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-token-field');
      const input = container.querySelector('input') as HTMLInputElement;
      const selectSpy = jest.spyOn(input, 'select');
      fireEvent.focus(input);

      expect(input).toHaveValue('0.2');
      expect(selectSpy).toHaveBeenCalled();
    });

    it('selects existing percent value on focus', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} balancePercent={42} />,
        mockStore,
      );

      const container = screen.getByTestId('balance-percent-input');
      const input = container.querySelector('input') as HTMLInputElement;
      const selectSpy = jest.spyOn(input, 'select');
      fireEvent.focus(input);
      expect(selectSpy).toHaveBeenCalled();
    });

    it('uses custom usdPlaceholder when provided', () => {
      renderWithProvider(
        <AmountInput {...defaultProps} usdPlaceholder="min $10" />,
        mockStore,
      );

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('placeholder', 'min $10');
    });

    it('exposes the USD input through usdInputRef', () => {
      const ref: { current: HTMLInputElement | null } = { current: null };
      renderWithProvider(
        <AmountInput {...defaultProps} usdInputRef={ref} />,
        mockStore,
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe('INPUT');
    });
  });
});
