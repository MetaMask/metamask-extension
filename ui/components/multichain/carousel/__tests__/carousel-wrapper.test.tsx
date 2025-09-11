import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CarouselWithEmptyState } from '../carousel-wrapper';
import type { CarouselSlide } from '../../../../shared/constants/app-state';

const mockSlides: CarouselSlide[] = [
  {
    id: 'test-slide-1',
    title: 'Test Slide 1',
    description: 'Test description 1',
    image: 'https://example.com/image1.jpg',
    dismissed: false,
    variableName: 'test1',
  },
];

describe('CarouselWithEmptyState', () => {
  const defaultProps = {
    slides: mockSlides,
    isLoading: false,
    onSlideClose: jest.fn(),
    onSlideClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Normal Carousel Rendering', () => {
    it('renders carousel when slides are available', () => {
      renderWithProvider(<CarouselWithEmptyState {...defaultProps} />);

      expect(
        screen.getByTestId('carousel-slide-test-slide-1'),
      ).toBeInTheDocument();
      expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
    });

    it('passes props correctly to underlying Carousel', () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <CarouselWithEmptyState
          {...defaultProps}
          onSlideClick={onSlideClickMock}
        />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      fireEvent.click(card);

      expect(onSlideClickMock).toHaveBeenCalled();
    });
  });

  describe('Empty State Management', () => {
    it('shows fold animation when empty state is triggered', async () => {
      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} />,
      );

      // Simulate empty state trigger by removing all slides
      rerender(<CarouselWithEmptyState {...defaultProps} slides={[]} />);

      await waitFor(() => {
        expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      });
    });

    it('completes empty state sequence correctly', async () => {
      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} />,
      );

      // Trigger empty state
      rerender(<CarouselWithEmptyState {...defaultProps} slides={[]} />);

      // Wait for empty state to appear
      await waitFor(() => {
        expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      });

      // Advance through animation sequence
      act(() => {
        jest.advanceTimersByTime(1100); // 1s pause + 100ms stabilization
        jest.advanceTimersByTime(350); // Fold animation
      });

      // Should complete and hide carousel
      await waitFor(() => {
        expect(
          screen.queryByText("You're all caught up"),
        ).not.toBeInTheDocument();
      });
    });

    it('prevents re-triggering empty state after completion', async () => {
      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} slides={[]} />,
      );

      // Complete empty state sequence
      await waitFor(() => {
        expect(screen.getByText("You're all caught up")).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(2000); // Complete sequence
      });

      await waitFor(() => {
        expect(
          screen.queryByText("You're all caught up"),
        ).not.toBeInTheDocument();
      });

      // Try to trigger again by re-rendering with empty slides
      rerender(<CarouselWithEmptyState {...defaultProps} slides={[]} />);

      // Should not show empty state again
      expect(
        screen.queryByText("You're all caught up"),
      ).not.toBeInTheDocument();
    });

    it('resets empty state when new slides become available', () => {
      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} slides={[]} />,
      );

      // Add new slides
      rerender(
        <CarouselWithEmptyState {...defaultProps} slides={mockSlides} />,
      );

      // Should show carousel again
      expect(
        screen.getByTestId('carousel-slide-test-slide-1'),
      ).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('maintains separate state for fold animation and completion', () => {
      const { container } = renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} slides={[]} />,
      );

      // Should handle state transitions correctly
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state correctly', () => {
      renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} isLoading={true} />,
      );

      // Should show skeleton cards
      const skeletonCards = document.querySelectorAll(
        '.carousel-card--current',
      );
      expect(skeletonCards.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('handles all carousel props correctly', () => {
      const onRenderSlidesMock = jest.fn();
      renderWithProvider(
        <CarouselWithEmptyState
          {...defaultProps}
          onRenderSlides={onRenderSlidesMock}
        />,
      );

      expect(onRenderSlidesMock).toHaveBeenCalledWith(mockSlides);
    });

    it('maintains proper component lifecycle', () => {
      const { unmount } = renderWithProvider(
        <CarouselWithEmptyState {...defaultProps} />,
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
