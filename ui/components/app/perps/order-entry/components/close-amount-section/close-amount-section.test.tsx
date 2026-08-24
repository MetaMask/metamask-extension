import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
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
      const container = screen.getByTestId('close-amount-value');
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/56,?250/u);
    });

    it('displays close amount USD based on percentage', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={75} />,
        mockStore,
      );

      const container = screen.getByTestId('close-amount-value');
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/84,?375/u);
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

      expect(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).toBeInTheDocument();
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

      const container = screen.getByTestId('close-amount-value');
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/56,?250/u);
      expect(screen.getByText(/50.*%/u)).toBeInTheDocument();
    });

    it('calculates 25% close USD value', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} closePercent={25} />,
        mockStore,
      );

      const container = screen.getByTestId('close-amount-value');
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/28,?125/u);
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

  describe('input mode selector', () => {
    it('offers a dollar mode, a percent mode, and the slider', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-mode-usd')).toBeInTheDocument();
      expect(
        screen.getByTestId('close-amount-mode-percent'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).toBeInTheDocument();
    });

    it('starts in dollar mode', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-unit')).toHaveTextContent('$');
      expect(screen.getByTestId('close-amount-value')).toBeInTheDocument();
      expect(
        screen.queryByTestId('close-amount-percent'),
      ).not.toBeInTheDocument();
    });

    it('swaps the field to a percent input when percent mode is selected', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      expect(screen.getByTestId('close-amount-unit')).toHaveTextContent('%');
      expect(screen.getByTestId('close-amount-percent')).toBeInTheDocument();
      expect(
        screen.queryByTestId('close-amount-value'),
      ).not.toBeInTheDocument();
    });
  });

  describe('dollar amount entry', () => {
    it('converts a typed dollar amount to the equivalent close percentage', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '56250' } });

      // 56,250 of a 112,500 position (2.5 BTC at 45,000) is half of it.
      expect(onClosePercentChange).toHaveBeenCalledWith(50);
    });

    it('converts a quarter-position dollar amount to 25 percent', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '28125' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(25);
    });

    it('reports keypad as the input method for a typed dollar amount', () => {
      const onInputMethodChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onInputMethodChange={onInputMethodChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '56250' } });

      expect(onInputMethodChange).toHaveBeenCalledWith('keypad');
    });
  });

  describe('percent amount entry', () => {
    const renderInPercentMode = (props = {}) => {
      const result = renderWithProvider(
        <CloseAmountSection {...defaultProps} {...props} />,
        mockStore,
      );
      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));
      return result;
    };

    it('commits a typed percentage', () => {
      const onClosePercentChange = jest.fn();
      renderInPercentMode({ onClosePercentChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '50' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(50);
    });

    it('commits a quarter close from a typed percentage', () => {
      const onClosePercentChange = jest.fn();
      renderInPercentMode({ onClosePercentChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '25' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(25);
    });

    it('treats an emptied percent field as closing nothing', () => {
      const onClosePercentChange = jest.fn();
      renderInPercentMode({ onClosePercentChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(0);
    });

    it('leaves the field empty while the trader clears it to retype', () => {
      const ControlledHarness = () => {
        const [percent, setPercent] = React.useState(100);
        return (
          <CloseAmountSection
            {...defaultProps}
            closePercent={percent}
            onClosePercentChange={setPercent}
          />
        );
      };
      renderWithProvider(<ControlledHarness />, mockStore);
      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '' } });

      expect(input.value).toBe('');
    });

    it('reports percentage as the input method for a typed percentage', () => {
      const onInputMethodChange = jest.fn();
      renderInPercentMode({ onInputMethodChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '50' } });

      expect(onInputMethodChange).toHaveBeenCalledWith('percentage');
    });

    it('reports max as the input method for a full close', () => {
      const onInputMethodChange = jest.fn();
      renderInPercentMode({ onInputMethodChange, closePercent: 25 });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '100' } });

      expect(onInputMethodChange).toHaveBeenCalledWith('max');
    });
  });

  describe('over-close protection', () => {
    it('caps a dollar amount above the position value and explains the cap', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '999999' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(100);
      expect(
        screen.getByTestId('close-amount-over-close-error'),
      ).toHaveTextContent(messages.perpsCloseAmountCappedAtPosition.message);
    });

    it('shows the capped dollar amount in the field rather than the typed one', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '999999' } });

      // 2.5 BTC at 45,000 is a 112,500 position.
      expect(input.value).toBe('112500');
    });

    it('caps a percentage above 100 and explains the cap', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );
      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '150' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(100);
      expect(
        screen.getByTestId('close-amount-over-close-error'),
      ).toHaveTextContent(messages.perpsClosePercentCappedAtMax.message);
    });

    it('never commits more than the whole position', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );
      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '150' } });

      const committed = onClosePercentChange.mock.calls.map(([value]) => value);
      expect(Math.max(...committed)).toBe(100);
    });

    it('clears the cap message once an amount that fits is entered', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);
      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '150' } });
      fireEvent.change(input, { target: { value: '40' } });

      expect(
        screen.queryByTestId('close-amount-over-close-error'),
      ).not.toBeInTheDocument();
    });
  });

  describe('unusable market data', () => {
    it('closes nothing when the position has no value', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          currentPrice={0}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '500' } });

      // A typed amount must never leave a stale percentage behind it.
      expect(onClosePercentChange).toHaveBeenCalledWith(0);
    });

    it('closes nothing while only a decimal point has been typed', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '.' } });

      expect(onClosePercentChange).toHaveBeenCalledWith(0);
    });
  });

  describe('cross-unit precision', () => {
    it('keeps the exact percentage a dollar amount resolves to', () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      // 1,000 of a 112,500 position is 0.888…%, not a whole percent.
      fireEvent.change(input, { target: { value: '1000' } });

      const [committed] = onClosePercentChange.mock.calls.at(-1) as [number];
      expect(committed).toBeCloseTo((1000 / 112500) * 100, 10);
    });

    it('shows a fractional percentage in the percent field rather than rounding it away', () => {
      const ControlledHarness = () => {
        const [percent, setPercent] = React.useState(100);
        return (
          <CloseAmountSection
            {...defaultProps}
            closePercent={percent}
            onClosePercentChange={setPercent}
          />
        );
      };
      renderWithProvider(<ControlledHarness />, mockStore);

      const usdInput = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      fireEvent.change(usdInput, { target: { value: '1000' } });
      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      const percentInput = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      expect(percentInput.value).toBe('0.89');
    });
  });

  describe('mode selector accessibility', () => {
    it('exposes the modes as a radio group with the active unit checked', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-mode-selector')).toHaveAttribute(
        'role',
        'radiogroup',
      );
      expect(screen.getByTestId('close-amount-mode-usd')).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByTestId('close-amount-mode-percent')).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('moves the checked state to percent when percent mode is selected', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('close-amount-mode-percent'));

      expect(screen.getByTestId('close-amount-mode-percent')).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByTestId('close-amount-mode-usd')).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  });

  describe('HIP-3 symbol display', () => {
    it('strips the dex prefix from HIP-3 asset symbols in the position size display', () => {
      renderWithProvider(
        <CloseAmountSection {...defaultProps} asset="xyz:BRENTOIL" />,
        mockStore,
      );

      expect(screen.getByText(/2\.5.*BRENTOIL/u)).toBeInTheDocument();
      expect(screen.queryByText(/xyz:BRENTOIL/u)).not.toBeInTheDocument();
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
