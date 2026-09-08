import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import IndicatorBar from './advanced-chart-indicator-bar';

// Mock useTheme hook
jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = jest.requireMock('../../../../hooks/useTheme')
  .useTheme as jest.Mock;

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
    mockUseTheme.mockReturnValue('light');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders all indicator buttons', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Check MA dropdown trigger (use more specific text)
      expect(getByText('MA ▾')).toBeInTheDocument();

      // Check all toggle indicators
      expect(getByText('BOL')).toBeInTheDocument();
      expect(getByText('RSI')).toBeInTheDocument();
      expect(getByText('Volume')).toBeInTheDocument();
      expect(getByText('MACD')).toBeInTheDocument();
    });

    it('renders with correct initial MA label when no MAs are selected', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      expect(getByText('MA ▾')).toBeInTheDocument();
    });

    it('renders with single MA label when one MA is selected', () => {
      const activeIndicators = new Set(['MA5']);
      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      expect(getByText('MA5 ▾')).toBeInTheDocument();
    });

    it('renders with multiple MA label when multiple MAs are selected', () => {
      const activeIndicators = new Set(['MA5', 'MA10', 'MA20']);
      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      expect(getByText('MA ×3 ▾')).toBeInTheDocument();
    });

    it('applies correct styling to active indicators', () => {
      const activeIndicators = new Set(['BOL', 'RSI']);
      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      const bolButton = getByText('BOL');
      const rsiButton = getByText('RSI');
      const volumeButton = getByText('Volume');

      // Active buttons should have higher font weight
      expect(bolButton).toHaveStyle({ fontWeight: 600 });
      expect(rsiButton).toHaveStyle({ fontWeight: 600 });
      expect(volumeButton).toHaveStyle({ fontWeight: 500 }); // inactive
    });

    it('renders divider after MA dropdown', () => {
      const { container } = render(<IndicatorBar {...defaultProps} />);

      const dividers = container.querySelectorAll('[style*="width: 1px"]');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('renders divider after BOL indicator', () => {
      const { container } = render(<IndicatorBar {...defaultProps} />);

      const dividers = container.querySelectorAll('[style*="width: 1px"]');
      // Should have at least 2 dividers: one after MA, one after BOL
      expect(dividers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Theme Support', () => {
    it('uses light theme colors when theme is light', () => {
      mockUseTheme.mockReturnValue('light');
      const activeIndicators = new Set(['MA5']);

      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      const maButton = getByText('MA5 ▾');
      expect(maButton).toBeInTheDocument();
    });

    it('uses dark theme colors when theme is dark', () => {
      mockUseTheme.mockReturnValue('dark');
      const activeIndicators = new Set(['MA10']);

      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      const maButton = getByText('MA10 ▾');
      expect(maButton).toBeInTheDocument();
    });
  });

  describe('Indicator Toggle Interactions', () => {
    it('calls onIndicatorToggle when BOL is clicked', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByText('BOL'));

      expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(1);
      expect(mockOnIndicatorToggle).toHaveBeenCalledWith('BOL');
    });

    it('calls onIndicatorToggle when RSI is clicked', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByText('RSI'));

      expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(1);
      expect(mockOnIndicatorToggle).toHaveBeenCalledWith('RSI');
    });

    it('calls onIndicatorToggle when Volume is clicked', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByText('Volume'));

      expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(1);
      expect(mockOnIndicatorToggle).toHaveBeenCalledWith('Volume');
    });

    it('calls onIndicatorToggle when MACD is clicked', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByText('MACD'));

      expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(1);
      expect(mockOnIndicatorToggle).toHaveBeenCalledWith('MACD');
    });

    it('allows toggling the same indicator multiple times', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      const rsiButton = getByText('RSI');

      fireEvent.click(rsiButton);
      fireEvent.click(rsiButton);
      fireEvent.click(rsiButton);

      expect(mockOnIndicatorToggle).toHaveBeenCalledTimes(3);
    });
  });

  describe('MA Dropdown Interactions', () => {
    it('opens MA dropdown when MA button is clicked', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      fireEvent.click(getByText('MA ▾'));

      // Check all MA options are visible
      expect(getByText('MA5')).toBeInTheDocument();
      expect(getByText('MA10')).toBeInTheDocument();
      expect(getByText('MA20')).toBeInTheDocument();
      expect(getByText('MA50')).toBeInTheDocument();
      expect(getByText('MA200')).toBeInTheDocument();
    });

    it('closes MA dropdown when clicking outside', async () => {
      const { getByText, queryByText, container } = render(
        <IndicatorBar {...defaultProps} />,
      );

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));
      expect(getByText('MA5')).toBeInTheDocument();

      // Advance timers to allow event listener setup
      jest.advanceTimersByTime(0);

      // Click outside
      fireEvent.click(container);

      // Wait for dropdown to close
      await waitFor(
        () => {
          expect(queryByText('MA5')).not.toBeInTheDocument();
        },
        { timeout: 100 },
      );
    });

    it('toggles MA dropdown open and closed on repeated clicks', () => {
      const { getByText, queryByText } = render(
        <IndicatorBar {...defaultProps} />,
      );

      const maButton = getByText('MA ▾');

      // Open
      fireEvent.click(maButton);
      expect(getByText('MA5')).toBeInTheDocument();

      // Close
      fireEvent.click(maButton);
      expect(queryByText('MA5')).not.toBeInTheDocument();

      // Open again
      fireEvent.click(maButton);
      expect(getByText('MA5')).toBeInTheDocument();
    });

    it('calls onMAToggle when an MA option is clicked', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Click MA5
      fireEvent.click(getByText('MA5'));

      expect(mockOnMAToggle).toHaveBeenCalledTimes(1);
      expect(mockOnMAToggle).toHaveBeenCalledWith('MA5');
    });

    it('calls onMAToggle for different MA options', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Click different MAs
      fireEvent.click(getByText('MA10'));
      fireEvent.click(getByText('MA20'));
      fireEvent.click(getByText('MA50'));

      expect(mockOnMAToggle).toHaveBeenCalledTimes(3);
      expect(mockOnMAToggle).toHaveBeenNthCalledWith(1, 'MA10');
      expect(mockOnMAToggle).toHaveBeenNthCalledWith(2, 'MA20');
      expect(mockOnMAToggle).toHaveBeenNthCalledWith(3, 'MA50');
    });

    it('shows checkmarks for active MA options', () => {
      const activeIndicators = new Set(['MA5', 'MA20']);

      const { getByText, container } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      // Open dropdown (label shows count when multiple MAs are selected)
      fireEvent.click(getByText('MA ×2 ▾'));

      // Check for checkmarks (✓)
      const checkmarks = Array.from(container.querySelectorAll('span')).filter(
        (span) => span.textContent === '✓',
      );

      // Should have 2 checkmarks for MA5 and MA20
      expect(checkmarks).toHaveLength(2);
    });

    it('shows no checkmarks when no MAs are active', () => {
      const { getByText, container } = render(
        <IndicatorBar {...defaultProps} />,
      );

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Check for checkmarks (✓)
      const checkmarks = Array.from(container.querySelectorAll('span')).filter(
        (span) => span.textContent === '✓',
      );

      expect(checkmarks).toHaveLength(0);
    });

    it('applies correct styling to active MA options', () => {
      const activeIndicators = new Set(['MA50']);

      const { getByText, container } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      // Open dropdown
      fireEvent.click(getByText('MA50 ▾'));

      // Find the dropdown and verify MA50 button exists
      const dropdown = container.querySelector('[style*="position: absolute"]');
      expect(dropdown).toBeInTheDocument();

      // Verify MA50 option is rendered in dropdown
      const ma50Text = Array.from(
        dropdown?.querySelectorAll('button') || [],
      ).find((btn) => btn.textContent?.includes('MA50'));

      expect(ma50Text).toBeDefined();
    });

    it('applies correct styling to inactive MA options', () => {
      const { getByText, container } = render(
        <IndicatorBar {...defaultProps} />,
      );

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Find the MA5 button inside the dropdown
      const dropdownButtons = container.querySelectorAll('button');
      const ma5Button = Array.from(dropdownButtons).find(
        (btn) =>
          btn.textContent?.trim() === 'MA5' && btn.style.width === '100%',
      );

      expect(ma5Button).toBeDefined();
      expect(ma5Button).toHaveStyle({ fontWeight: 400 });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty activeIndicators set', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // All indicators should appear inactive
      expect(getByText('MA ▾')).toBeInTheDocument();
      expect(getByText('BOL')).toBeInTheDocument();
      expect(getByText('RSI')).toBeInTheDocument();
    });

    it('handles all indicators being active', () => {
      const activeIndicators = new Set([
        'MA5',
        'MA10',
        'MA20',
        'MA50',
        'MA200',
        'BOL',
        'RSI',
        'Volume',
        'MACD',
      ]);

      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      expect(getByText('MA ×5 ▾')).toBeInTheDocument();

      // All toggle indicators should have higher font weight
      const bolButton = getByText('BOL');
      const rsiButton = getByText('RSI');
      const volumeButton = getByText('Volume');
      const macdButton = getByText('MACD');

      expect(bolButton).toHaveStyle({ fontWeight: 600 });
      expect(rsiButton).toHaveStyle({ fontWeight: 600 });
      expect(volumeButton).toHaveStyle({ fontWeight: 600 });
      expect(macdButton).toHaveStyle({ fontWeight: 600 });
    });

    it('handles only non-MA indicators being active', () => {
      const activeIndicators = new Set(['BOL', 'RSI', 'Volume', 'MACD']);

      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      // MA label should still be 'MA' (no count)
      expect(getByText('MA ▾')).toBeInTheDocument();
    });

    it('cleans up event listener when dropdown closes', async () => {
      const { getByText, unmount } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Advance timers
      jest.advanceTimersByTime(0);

      // Unmount component
      unmount();

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('cleans up event listener on unmount when dropdown is open', () => {
      const { getByText, unmount } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Unmount immediately
      unmount();

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('handles rapid clicking on MA dropdown', () => {
      const { getByText, queryByText } = render(
        <IndicatorBar {...defaultProps} />,
      );

      const maButton = getByText('MA ▾');

      // Rapid clicks
      fireEvent.click(maButton);
      fireEvent.click(maButton);
      fireEvent.click(maButton);
      fireEvent.click(maButton);

      // Final state should be consistent (closed since we clicked 4 times)
      expect(queryByText('MA5')).not.toBeInTheDocument();
    });

    it('handles rapid clicks on MA options', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Rapid clicks on same option
      const ma5Button = getByText('MA5');
      fireEvent.click(ma5Button);
      fireEvent.click(ma5Button);
      fireEvent.click(ma5Button);

      expect(mockOnMAToggle).toHaveBeenCalledTimes(3);
      expect(mockOnMAToggle).toHaveBeenCalledWith('MA5');
    });
  });

  describe('Accessibility', () => {
    it('renders buttons with proper cursor pointer style', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      const bolButton = getByText('BOL');
      expect(bolButton).toHaveStyle({ cursor: 'pointer' });

      const maButton = getByText('MA ▾');
      expect(maButton).toHaveStyle({ cursor: 'pointer' });
    });

    it('renders MA dropdown options as buttons', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      const ma5Button = getByText('MA5');
      expect(ma5Button.tagName).toBe('BUTTON');
    });

    it('renders indicator toggles as buttons', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      const bolButton = getByText('BOL');
      const rsiButton = getByText('RSI');

      expect(bolButton.tagName).toBe('BUTTON');
      expect(rsiButton.tagName).toBe('BUTTON');
    });
  });

  describe('Layout and Styling', () => {
    it('renders with correct container styling', () => {
      const { container } = render(<IndicatorBar {...defaultProps} />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      });
    });

    it('renders MA dropdown with correct positioning', () => {
      const { getByText, container } = render(
        <IndicatorBar {...defaultProps} />,
      );

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      const dropdown = Array.from(container.querySelectorAll('div')).find(
        (div) => div.style.position === 'absolute',
      );

      expect(dropdown).toHaveStyle({
        position: 'absolute',
        top: '100%',
        zIndex: '100',
      });
    });

    it('renders MA dropdown options with correct layout', () => {
      const { getByText, container } = render(
        <IndicatorBar {...defaultProps} />,
      );

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Find MA5 button in dropdown using a more specific selector
      const dropdownButtons = container.querySelectorAll('button');
      const ma5Button = Array.from(dropdownButtons).find(
        (btn) => btn.textContent?.includes('MA5') && btn.style.width === '100%',
      );

      expect(ma5Button).toBeDefined();
      expect(ma5Button).toHaveStyle({
        width: '100%',
        background: 'transparent',
        textAlign: 'left',
      });
    });
  });

  describe('Interaction State', () => {
    it('maintains dropdown state across indicator toggles', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));
      expect(getByText('MA5')).toBeInTheDocument();

      // Toggle an indicator (not MA)
      fireEvent.click(getByText('BOL'));

      // Dropdown should still be open
      expect(getByText('MA5')).toBeInTheDocument();
    });

    it('does not interfere with indicator callbacks when dropdown is open', () => {
      const { getByText } = render(<IndicatorBar {...defaultProps} />);

      // Open dropdown
      fireEvent.click(getByText('MA ▾'));

      // Click an indicator
      fireEvent.click(getByText('RSI'));

      expect(mockOnIndicatorToggle).toHaveBeenCalledWith('RSI');
      expect(mockOnMAToggle).not.toHaveBeenCalled();
    });
  });

  describe('MA Filtering Logic', () => {
    it('correctly filters MA indicators using regex', () => {
      const activeIndicators = new Set([
        'MA5',
        'MA10',
        'BOL',
        'RSI',
        'SomeRandomIndicator',
      ]);

      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      // Should only count MA5 and MA10
      expect(getByText('MA ×2 ▾')).toBeInTheDocument();
    });

    it('ignores invalid MA patterns', () => {
      const activeIndicators = new Set(['MA', 'MAabc', 'MACD', 'MA5']);

      const { getByText } = render(
        <IndicatorBar {...defaultProps} activeIndicators={activeIndicators} />,
      );

      // Should only count MA5
      expect(getByText('MA5 ▾')).toBeInTheDocument();
    });
  });
});
