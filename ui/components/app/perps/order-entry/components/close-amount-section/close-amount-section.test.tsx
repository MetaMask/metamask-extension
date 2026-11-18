import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/**
 * Runs realistic user interactions with their React updates contained.
 *
 * `userEvent` resolves between keystrokes, so the re-renders it triggers land
 * outside React's test scope and are reported as act warnings. Wrapping the
 * whole interaction keeps the realistic input behaviour without adding noise.
 *
 * @param interact - Callback issuing the userEvent calls.
 */
const interactAs = async (
  interact: (user: ReturnType<typeof userEvent.setup>) => Promise<void>,
) => {
  const user = userEvent.setup();
  await act(async () => {
    await interact(user);
  });
};

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

      expect(screen.getByTestId('close-amount-unit')).toHaveTextContent(
        messages.perpsCloseAmountInUsd.message,
      );
      expect(screen.getByTestId('close-amount-value')).toBeInTheDocument();
      expect(
        screen.queryByTestId('close-amount-percent'),
      ).not.toBeInTheDocument();
    });

    it('swaps the field to a percent input when percent mode is selected', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      expect(screen.getByTestId('close-amount-unit')).toHaveTextContent(
        messages.perpsCloseAmountInPercent.message,
      );
      expect(screen.getByTestId('close-amount-percent')).toBeInTheDocument();
      expect(
        screen.queryByTestId('close-amount-value'),
      ).not.toBeInTheDocument();
    });
  });

  describe('dollar amount entry', () => {
    it('converts a typed dollar amount to the equivalent close percentage', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('56250');
      });

      // 56,250 of a 112,500 position (2.5 BTC at 45,000) is half of it.
      expect(onClosePercentChange).toHaveBeenCalledWith(50);
    });

    it('converts a quarter-position dollar amount to 25 percent', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('28125');
      });

      expect(onClosePercentChange).toHaveBeenCalledWith(25);
    });

    it('limits a typed dollar amount to whole cents', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      // Matches mobile, which slices the decimal part to two digits rather than
      // rounding it, so the committed percentage reflects what was entered.
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('1234.5678');
      });

      expect(input.value).toBe('1234.56');
    });

    it('keeps a trailing decimal point while the trader is still typing', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('12.');
      });

      expect(input.value).toBe('12.');
    });

    it('reports keypad as the input method for a typed dollar amount', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('56250');
      });

      expect(onInputMethodChange).toHaveBeenCalledWith('keypad');
    });
  });

  describe('percent amount entry', () => {
    const renderInPercentMode = async (props = {}) => {
      const result = renderWithProvider(
        <CloseAmountSection {...defaultProps} {...props} />,
        mockStore,
      );
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );
      return result;
    };

    it('commits a typed percentage', async () => {
      const onClosePercentChange = jest.fn();
      await renderInPercentMode({ onClosePercentChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('50');
      });

      expect(onClosePercentChange).toHaveBeenCalledWith(50);
    });

    it('commits a quarter close from a typed percentage', async () => {
      const onClosePercentChange = jest.fn();
      await renderInPercentMode({ onClosePercentChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('25');
      });

      expect(onClosePercentChange).toHaveBeenCalledWith(25);
    });

    it('treats an emptied percent field as closing nothing', async () => {
      const onClosePercentChange = jest.fn();
      await renderInPercentMode({ onClosePercentChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs((user) => user.clear(input));

      expect(onClosePercentChange).toHaveBeenCalledWith(0);
    });

    it('leaves the field empty while the trader clears it to retype', async () => {
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
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs((user) => user.clear(input));

      expect(input.value).toBe('');
    });

    it('reports percentage as the input method for a typed percentage', async () => {
      const onInputMethodChange = jest.fn();
      await renderInPercentMode({ onInputMethodChange });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('50');
      });

      expect(onInputMethodChange).toHaveBeenCalledWith('percentage');
    });

    it('reports percentage, not max, for a typed full close', async () => {
      const onInputMethodChange = jest.fn();
      await renderInPercentMode({ onInputMethodChange, closePercent: 25 });

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('100');
      });

      // Mobile reserves 'max' for an explicit Max button, which this screen has
      // no equivalent of, so inferring it from 100 would diverge the funnel.
      expect(onInputMethodChange).toHaveBeenCalledWith('percentage');
      expect(onInputMethodChange).not.toHaveBeenCalledWith('max');
    });
  });

  describe('over-close protection', () => {
    it('caps a dollar amount above the position value and explains the cap', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('999999');
      });

      expect(onClosePercentChange).toHaveBeenCalledWith(100);
      expect(
        screen.getByTestId('close-amount-over-close-error'),
      ).toHaveTextContent(messages.perpsCloseAmountCappedAtPosition.message);
    });

    it('shows the capped dollar amount in the field rather than the typed one', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      const input = screen
        .getByTestId('close-amount-value')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('999999');
      });

      // 2.5 BTC at 45,000 is a 112,500 position.
      expect(input.value).toBe('112500');
    });

    it('caps a percentage above 100 and explains the cap', async () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('150');
      });

      expect(onClosePercentChange).toHaveBeenCalledWith(100);
      expect(
        screen.getByTestId('close-amount-over-close-error'),
      ).toHaveTextContent(messages.perpsClosePercentCappedAtMax.message);
    });

    it('shows the capped percentage in the field rather than the typed one', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('150');
      });

      // Matches the dollar field, which caps in place on the same keystroke.
      expect(input.value).toBe('100');
    });

    it('never commits more than the whole position', async () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('150');
      });

      const committed = onClosePercentChange.mock.calls.map(([value]) => value);
      expect(Math.max(...committed)).toBe(100);
    });

    it('caps a dollar amount too large to hold in a number', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('9'.repeat(320));
      });

      // Overflows to Infinity, which still means "more than the position".
      // Committing 0 here would show a 100% cap while closing nothing.
      expect(onClosePercentChange).toHaveBeenLastCalledWith(100);
      expect(
        screen.getByTestId('close-amount-over-close-error'),
      ).toBeInTheDocument();
    });

    it('caps a percentage too large to hold in a number', async () => {
      const onClosePercentChange = jest.fn();
      renderWithProvider(
        <CloseAmountSection
          {...defaultProps}
          onClosePercentChange={onClosePercentChange}
        />,
        mockStore,
      );
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('9'.repeat(320));
      });

      expect(onClosePercentChange).toHaveBeenLastCalledWith(100);
    });

    it('clears the cap message once an amount that fits is entered', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('150');
      });
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('40');
      });

      expect(
        screen.queryByTestId('close-amount-over-close-error'),
      ).not.toBeInTheDocument();
    });
  });

  describe('unusable market data', () => {
    it('closes nothing when the position has no value', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('500');
      });

      // A typed amount must never leave a stale percentage behind it.
      expect(onClosePercentChange).toHaveBeenCalledWith(0);
    });

    it('closes nothing while only a decimal point has been typed', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('.');
      });

      expect(onClosePercentChange).toHaveBeenCalledWith(0);
    });
  });

  describe('cross-unit precision', () => {
    it('closes exactly the dollar amount the trader typed', async () => {
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
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('1000');
      });

      const [committed] = onClosePercentChange.mock.calls.at(-1) as [number];
      // Deliberately un-rounded. A percentage step is worth more the larger the
      // position — 0.01% of this 112,500 position is $11.25 — so rounding here
      // would close more than the typed 1,000.
      expect(committed).toBe((1000 / 112500) * 100);
      expect((112500 * committed) / 100).toBeCloseTo(1000, 10);
    });

    it('lets the trader edit a fractional percentage the field is showing', async () => {
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
      await interactAs(async (user) => {
        await user.clear(usdInput);
        await user.paste('1000');
      });
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const percentInput = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      // The field displays 0.89, so a decimal edit of it must be accepted.
      await interactAs(async (user) => {
        await user.clear(percentInput);
        await user.paste('0.5');
      });

      expect(percentInput.value).toBe('0.5');
    });

    it('commits the same percentage the field shows after blur', async () => {
      let committed = 100;
      const ControlledHarness = () => {
        const [percent, setPercent] = React.useState(100);
        committed = percent;
        return (
          <CloseAmountSection
            {...defaultProps}
            closePercent={percent}
            onClosePercentChange={setPercent}
          />
        );
      };
      renderWithProvider(<ControlledHarness />, mockStore);
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('99.999');
      });
      fireEvent.blur(input);

      // The field can only render two decimals, so committing 99.999 would show
      // "100" while leaving a sliver of the position open.
      expect(input.value).toBe('100');
      expect(committed).toBe(100);
    });

    it('keeps a percentage within the displayed precision intact', async () => {
      let committed = 100;
      const ControlledHarness = () => {
        const [percent, setPercent] = React.useState(100);
        committed = percent;
        return (
          <CloseAmountSection
            {...defaultProps}
            closePercent={percent}
            onClosePercentChange={setPercent}
          />
        );
      };
      renderWithProvider(<ControlledHarness />, mockStore);
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const input = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      await interactAs(async (user) => {
        await user.clear(input);
        await user.paste('12.34');
      });
      fireEvent.blur(input);

      expect(input.value).toBe('12.34');
      expect(committed).toBe(12.34);
    });

    it('shows a fractional percentage in the percent field rather than rounding it away', async () => {
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
      await interactAs(async (user) => {
        await user.clear(usdInput);
        await user.paste('1000');
      });
      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      const percentInput = screen
        .getByTestId('close-amount-percent')
        .querySelector('input') as HTMLInputElement;
      expect(percentInput.value).toBe('0.89');
    });
  });

  describe('mode selector accessibility', () => {
    it('names each mode for screen readers rather than relying on the glyph', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-mode-usd')).toHaveAttribute(
        'aria-label',
        messages.perpsCloseAmountInUsdLabel.message,
      );
      expect(screen.getByTestId('close-amount-mode-percent')).toHaveAttribute(
        'aria-label',
        messages.perpsCloseAmountInPercentLabel.message,
      );
    });

    it('marks the active unit as pressed', () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      expect(screen.getByTestId('close-amount-mode-usd')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByTestId('close-amount-mode-percent')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('moves the pressed state to percent when percent mode is selected', async () => {
      renderWithProvider(<CloseAmountSection {...defaultProps} />, mockStore);

      await interactAs((user) =>
        user.click(screen.getByTestId('close-amount-mode-percent')),
      );

      expect(screen.getByTestId('close-amount-mode-percent')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByTestId('close-amount-mode-usd')).toHaveAttribute(
        'aria-pressed',
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
