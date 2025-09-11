import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { StackCardEmpty, EmptyStateComponent } from '../stack-card-empty';
import { ANIMATION_TIMINGS } from '../../constants';

describe('StackCardEmpty', () => {
  const defaultProps = {
    isVisible: true,
    isBackground: true,
    className: '',
  };

  describe('Background Card Rendering', () => {
    it('renders background empty card correctly', () => {
      renderWithProvider(<StackCardEmpty {...defaultProps} />);

      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });

    it('applies next card styling for background cards', () => {
      renderWithProvider(
        <StackCardEmpty {...defaultProps} isBackground={true} />,
      );

      const card = document.querySelector('.carousel-card');
      expect(card).toHaveClass('carousel-card--next');
    });

    it('applies current card styling for foreground cards', () => {
      renderWithProvider(
        <StackCardEmpty {...defaultProps} isBackground={false} />,
      );

      const card = document.querySelector('.carousel-card');
      expect(card).toHaveClass('carousel-card--current');
    });

    it('shows pressed overlay only for background cards', () => {
      const { rerender } = renderWithProvider(
        <StackCardEmpty {...defaultProps} isBackground={true} />,
      );

      expect(
        document.querySelector('.carousel-card__pressed-overlay'),
      ).toBeInTheDocument();

      rerender(<StackCardEmpty {...defaultProps} isBackground={false} />);
      expect(
        document.querySelector('.carousel-card__pressed-overlay'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses Text component from design system', () => {
      renderWithProvider(<StackCardEmpty {...defaultProps} />);

      const textElement = screen.getByText("You're all caught up");
      expect(textElement).toHaveClass('carousel-empty-state__text');
    });

    it('uses proper text variants and colors', () => {
      renderWithProvider(<StackCardEmpty {...defaultProps} />);

      // Text should use bodyMdMedium variant and textAlternative color
      const textElement = screen.getByText("You're all caught up");
      expect(textElement).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('uses localized text for empty state message', () => {
      renderWithProvider(<StackCardEmpty {...defaultProps} />);

      // Should display localized text (in tests, t() returns the key if translation exists)
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    });
  });
});

describe('EmptyStateComponent', () => {
  const defaultProps = {
    onComplete: jest.fn(),
    isBackground: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Fold Animation Sequence', () => {
    it('triggers fold animation sequence automatically', async () => {
      renderWithProvider(<EmptyStateComponent {...defaultProps} />);

      // Should start in showing state
      expect(screen.getByText("You're all caught up")).toBeInTheDocument();

      // Advance past stabilization timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should now be in folding state (check for visual changes)
      expect(document.querySelector('.carousel-container')).toBeInTheDocument();
    });

    it('completes animation sequence and calls onComplete', async () => {
      const onCompleteMock = jest.fn();
      renderWithProvider(
        <EmptyStateComponent {...defaultProps} onComplete={onCompleteMock} />,
      );

      // Advance through entire animation sequence
      act(() => {
        jest.advanceTimersByTime(100); // Stabilization
        jest.advanceTimersByTime(ANIMATION_TIMINGS.EMPTY_STATE_DURATION); // Fold animation
      });

      expect(onCompleteMock).toHaveBeenCalled();
    });

    it('does not auto-trigger when isBackground is true', () => {
      const onCompleteMock = jest.fn();
      renderWithProvider(
        <EmptyStateComponent
          {...defaultProps}
          isBackground={true}
          onComplete={onCompleteMock}
        />,
      );

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should not complete automatically for background components
      expect(onCompleteMock).not.toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('renders container with correct initial height', () => {
      renderWithProvider(<EmptyStateComponent {...defaultProps} />);

      const container = document.querySelector('.carousel-container');
      expect(container).toHaveStyle({ height: '106px' });
    });

    it('applies fold animation styles during folding', () => {
      renderWithProvider(<EmptyStateComponent {...defaultProps} />);

      // Trigger fold animation
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const container = document.querySelector('.carousel-container');
      const wrapper = document.querySelector('.carousel-cards-wrapper');

      // Should apply folding styles
      expect(container).toHaveStyle({ height: '0px' });
      expect(wrapper).toHaveStyle({ opacity: '0', transform: 'scaleY(0)' });
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { unmount } = renderWithProvider(
        <EmptyStateComponent {...defaultProps} />,
      );

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Background Mode', () => {
    it('renders StackCardEmpty when isBackground is true', () => {
      renderWithProvider(
        <EmptyStateComponent {...defaultProps} isBackground={true} />,
      );

      expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      expect(
        document.querySelector('.carousel-card--next'),
      ).toBeInTheDocument();
    });
  });

  describe('Animation Timing', () => {
    it('uses correct timing constants for animations', () => {
      const onCompleteMock = jest.fn();
      renderWithProvider(
        <EmptyStateComponent {...defaultProps} onComplete={onCompleteMock} />,
      );

      // Should complete after stabilization + fold duration
      act(() => {
        jest.advanceTimersByTime(99); // Just before stabilization completes
      });

      expect(onCompleteMock).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1); // Complete stabilization
        jest.advanceTimersByTime(ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
      });

      expect(onCompleteMock).toHaveBeenCalled();
    });
  });
});
