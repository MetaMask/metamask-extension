import React from 'react';
import { it } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react';
import IndicatorBar, { isMovingAverage } from './advanced-chart-indicator-bar';

describe('IndicatorBar', () => {
  const mockOnIndicatorToggle = jest.fn();
  const mockOnMAToggle = jest.fn();

  const defaultProps = {
    activeIndicators: new Set<string>(),
    onIndicatorToggle: mockOnIndicatorToggle,
    onMAToggle: mockOnMAToggle,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the MA trigger and every toggle pill', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      expect(getByTestId('advanced-chart-ma-trigger')).toHaveTextContent('MA');
      expect(getByTestId('advanced-chart-indicator-BOL')).toBeInTheDocument();
      expect(getByTestId('advanced-chart-indicator-RSI')).toBeInTheDocument();
      expect(
        getByTestId('advanced-chart-indicator-Volume'),
      ).toBeInTheDocument();
      expect(getByTestId('advanced-chart-indicator-MACD')).toBeInTheDocument();
    });

    it('labels the MA trigger with the single selected MA', () => {
      const { getByTestId } = render(
        <IndicatorBar {...defaultProps} activeIndicators={new Set(['MA5'])} />,
      );

      expect(getByTestId('advanced-chart-ma-trigger')).toHaveTextContent('MA5');
    });

    it('labels the MA trigger with a count when multiple MAs are selected', () => {
      const { getByTestId } = render(
        <IndicatorBar
          {...defaultProps}
          activeIndicators={new Set(['MA5', 'MA10', 'MA20'])}
        />,
      );

      expect(getByTestId('advanced-chart-ma-trigger')).toHaveTextContent(
        'MA ×3',
      );
    });

    it('marks active toggle pills as pressed', () => {
      const { getByTestId } = render(
        <IndicatorBar
          {...defaultProps}
          activeIndicators={new Set(['BOL', 'RSI'])}
        />,
      );

      expect(getByTestId('advanced-chart-indicator-BOL')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(getByTestId('advanced-chart-indicator-RSI')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(getByTestId('advanced-chart-indicator-Volume')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('renders dividers after the MA trigger and after BOL', () => {
      const { container } = render(<IndicatorBar {...defaultProps} />);

      const dividers = container.querySelectorAll('.w-px');
      expect(dividers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Indicator toggle interactions', () => {
    it.each(['BOL', 'RSI', 'Volume', 'MACD'])(
      'calls onIndicatorToggle when %s is clicked',
      (name: string) => {
        const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

        fireEvent.click(getByTestId(`advanced-chart-indicator-${name}`));

        expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(1);
        expect(mockOnIndicatorToggle).toHaveBeenCalledWith(name);
      },
    );

    it('allows toggling the same indicator multiple times', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      const rsiButton = getByTestId('advanced-chart-indicator-RSI');
      fireEvent.click(rsiButton);
      fireEvent.click(rsiButton);
      fireEvent.click(rsiButton);

      expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(3);
    });
  });

  describe('MA dropdown interactions', () => {
    it('opens the MA dropdown with every option when the trigger is clicked', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));

      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();
      ['MA5', 'MA10', 'MA20', 'MA50', 'MA200'].forEach((ma) => {
        expect(
          getByTestId(`advanced-chart-ma-option-${ma}`),
        ).toBeInTheDocument();
      });
    });

    it('closes the MA dropdown when clicking outside', async () => {
      const { getByTestId, queryByTestId, container } = render(
        <IndicatorBar {...defaultProps} />,
      );

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();

      jest.advanceTimersByTime(0);
      fireEvent.click(container);

      await waitFor(() => {
        expect(queryByTestId('advanced-chart-ma-menu')).not.toBeInTheDocument();
      });
    });

    it('closes the MA dropdown when pressing Escape', async () => {
      const { getByTestId, queryByTestId } = render(
        <IndicatorBar {...defaultProps} />,
      );

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(queryByTestId('advanced-chart-ma-menu')).not.toBeInTheDocument();
      });
    });

    it('toggles the MA dropdown open and closed on repeated clicks', () => {
      const { getByTestId, queryByTestId } = render(
        <IndicatorBar {...defaultProps} />,
      );

      const trigger = getByTestId('advanced-chart-ma-trigger');

      fireEvent.click(trigger);
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();

      fireEvent.click(trigger);
      expect(queryByTestId('advanced-chart-ma-menu')).not.toBeInTheDocument();

      fireEvent.click(trigger);
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();
    });

    it('calls onMAToggle when an MA option is clicked', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      fireEvent.click(getByTestId('advanced-chart-ma-option-MA5'));

      expect(mockOnMAToggle).toHaveBeenCalledTimes(1);
      expect(mockOnMAToggle).toHaveBeenCalledWith('MA5');
    });

    it('calls onMAToggle for each distinct MA option', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      fireEvent.click(getByTestId('advanced-chart-ma-option-MA10'));
      fireEvent.click(getByTestId('advanced-chart-ma-option-MA20'));
      fireEvent.click(getByTestId('advanced-chart-ma-option-MA50'));

      expect(mockOnMAToggle).toHaveBeenCalledTimes(3);
      expect(mockOnMAToggle).toHaveBeenNthCalledWith(1, 'MA10');
      expect(mockOnMAToggle).toHaveBeenNthCalledWith(2, 'MA20');
      expect(mockOnMAToggle).toHaveBeenNthCalledWith(3, 'MA50');
    });

    it('checks the options that are active and leaves the rest unchecked', () => {
      const { getByTestId } = render(
        <IndicatorBar
          {...defaultProps}
          activeIndicators={new Set(['MA5', 'MA20'])}
        />,
      );

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));

      expect(getByTestId('advanced-chart-ma-option-MA5')).toBeChecked();
      expect(getByTestId('advanced-chart-ma-option-MA20')).toBeChecked();
      expect(getByTestId('advanced-chart-ma-option-MA10')).not.toBeChecked();
      expect(getByTestId('advanced-chart-ma-option-MA50')).not.toBeChecked();
      expect(getByTestId('advanced-chart-ma-option-MA200')).not.toBeChecked();
    });

    it('stays open after an MA option is selected so several can be toggled', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      // The outside-click listener is only armed after this tick.
      jest.advanceTimersByTime(0);

      // Clicking an option bubbles to the document; the menu must not treat its
      // own option as an outside click and close.
      fireEvent.click(getByTestId('advanced-chart-ma-option-MA5'));
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();

      fireEvent.click(getByTestId('advanced-chart-ma-option-MA10'));
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();
      expect(mockOnMAToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge cases', () => {
    it('keeps the MA label as "MA" when only non-MA indicators are active', () => {
      const { getByTestId } = render(
        <IndicatorBar
          {...defaultProps}
          activeIndicators={new Set(['BOL', 'RSI', 'Volume', 'MACD'])}
        />,
      );

      expect(getByTestId('advanced-chart-ma-trigger')).toHaveTextContent('MA');
    });

    it('labels the trigger with the full count when every MA is active', () => {
      const { getByTestId } = render(
        <IndicatorBar
          {...defaultProps}
          activeIndicators={new Set(['MA5', 'MA10', 'MA20', 'MA50', 'MA200'])}
        />,
      );

      expect(getByTestId('advanced-chart-ma-trigger')).toHaveTextContent(
        'MA ×5',
      );
    });

    it('cleans up listeners on unmount while the dropdown is open', () => {
      const { getByTestId, unmount } = render(
        <IndicatorBar {...defaultProps} />,
      );

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      jest.advanceTimersByTime(0);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('MA filtering logic', () => {
    it('recognises moving-average names via isMovingAverage', () => {
      expect(isMovingAverage('MA5')).toBe(true);
      expect(isMovingAverage('MA200')).toBe(true);
      expect(isMovingAverage('MACD')).toBe(false);
      expect(isMovingAverage('MA')).toBe(false);
      expect(isMovingAverage('RSI')).toBe(false);
    });

    it('counts only valid MA patterns in the trigger label', () => {
      const { getByTestId } = render(
        <IndicatorBar
          {...defaultProps}
          activeIndicators={
            new Set(['MA5', 'MA10', 'BOL', 'RSI', 'SomeRandomIndicator'])
          }
        />,
      );

      expect(getByTestId('advanced-chart-ma-trigger')).toHaveTextContent(
        'MA ×2',
      );
    });
  });

  describe('Interaction state', () => {
    it('keeps the dropdown open when toggling a non-MA indicator', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));
      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();

      fireEvent.click(getByTestId('advanced-chart-indicator-BOL'));

      expect(getByTestId('advanced-chart-ma-menu')).toBeInTheDocument();
      expect(mockOnIndicatorToggle).toHaveBeenCalledWith('BOL');
      expect(mockOnMAToggle).not.toHaveBeenCalled();
    });
  });

  describe('Layout', () => {
    it('scrolls the pills instead of widening the page in a narrow panel', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      expect(getByTestId('advanced-chart-indicator-pills')).toHaveStyle({
        minWidth: '0',
        overflowX: 'auto',
      });
    });

    it('keeps the MA dropdown outside the scrolling pills row so it is not clipped', () => {
      const { getByTestId } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByTestId('advanced-chart-ma-trigger'));

      expect(
        getByTestId('advanced-chart-indicator-pills').contains(
          getByTestId('advanced-chart-ma-menu'),
        ),
      ).toBe(false);
    });
  });
});
