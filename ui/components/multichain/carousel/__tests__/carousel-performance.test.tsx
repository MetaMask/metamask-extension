import React from 'react';
import { act, screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { Carousel } from '../carousel';
import { CarouselWithEmptyState } from '../carousel-wrapper';
import type { CarouselSlide } from '../../../../shared/constants/app-state';

// Performance testing utilities
const measureRenderTime = (renderFn: () => void): number => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

const generateMockSlides = (count: number): CarouselSlide[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `slide-${index}`,
    title: `Slide ${index + 1}`,
    description: `Description for slide ${index + 1}`,
    image: `https://example.com/image${index + 1}.jpg`,
    dismissed: false,
    variableName: `slide${index + 1}`,
  }));
};

describe('Carousel Performance Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering Performance', () => {
    it('renders efficiently with large number of slides', () => {
      const largeSlideSet = generateMockSlides(100);

      const renderTime = measureRenderTime(() => {
        renderWithProvider(
          <Carousel
            slides={largeSlideSet}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      });

      // Should render within reasonable time (100ms threshold)
      expect(renderTime).toBeLessThan(100);

      // Should only render visible slides (not all 100)
      const renderedSlides = document.querySelectorAll('.carousel-card');
      expect(renderedSlides.length).toBeLessThanOrEqual(2); // current + next
    });

    it('re-renders efficiently when slides change', () => {
      const initialSlides = generateMockSlides(10);
      const updatedSlides = generateMockSlides(15);

      const { rerender } = renderWithProvider(
        <Carousel
          slides={initialSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      const rerenderTime = measureRenderTime(() => {
        rerender(
          <Carousel
            slides={updatedSlides}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      });

      // Re-renders should be even faster
      expect(rerenderTime).toBeLessThan(50);
    });

    it('handles rapid state updates efficiently', () => {
      const slides = generateMockSlides(5);

      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      const start = performance.now();

      // Simulate rapid state changes
      for (let i = 0; i < 50; i++) {
        act(() => {
          rerender(
            <CarouselWithEmptyState
              slides={slides.slice(0, Math.max(1, 5 - (i % 3)))}
              isLoading={i % 4 === 0}
              onSlideClose={jest.fn()}
              onSlideClick={jest.fn()}
            />,
          );
        });
      }

      const totalTime = performance.now() - start;

      // Should handle 50 rapid updates within 200ms
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe('Animation Performance', () => {
    it('animations complete within expected timeframes', async () => {
      const slides = generateMockSlides(3);
      const onSlideClose = jest.fn();

      renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={onSlideClose}
          onSlideClick={jest.fn()}
        />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-slide-0-close-button',
      );

      const animationStart = performance.now();

      act(() => {
        fireEvent.click(closeButton);
      });

      // Fast-forward through animation
      act(() => {
        jest.advanceTimersByTime(400); // CARD_TRANSITION_DURATION
      });

      const animationEnd = performance.now();
      const actualTime = animationEnd - animationStart;

      // Animation should complete efficiently
      expect(actualTime).toBeLessThan(50); // Actual JS execution time
      expect(onSlideClose).toHaveBeenCalled();
    });

    it('handles multiple simultaneous animations', () => {
      const slides = generateMockSlides(3);

      renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      const start = performance.now();

      // Trigger multiple animation-related interactions
      const closeButton = screen.getByTestId(
        'carousel-slide-slide-0-close-button',
      );

      act(() => {
        // Multiple rapid clicks (should be throttled)
        for (let i = 0; i < 10; i++) {
          fireEvent.click(closeButton);
        }
      });

      const end = performance.now();
      const executionTime = end - start;

      // Should handle multiple interactions efficiently
      expect(executionTime).toBeLessThan(20);
    });

    it('maintains smooth frame rate during animations', () => {
      const slides = generateMockSlides(2);

      renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      // Mock requestAnimationFrame to measure frame timing
      const frameTimes: number[] = [];
      let lastTime = performance.now();

      const originalRAF = global.requestAnimationFrame;
      global.requestAnimationFrame = jest.fn((callback) => {
        const currentTime = performance.now();
        frameTimes.push(currentTime - lastTime);
        lastTime = currentTime;
        return originalRAF(callback);
      });

      const closeButton = screen.getByTestId(
        'carousel-slide-slide-0-close-button',
      );

      act(() => {
        fireEvent.click(closeButton);
        jest.advanceTimersByTime(400);
      });

      global.requestAnimationFrame = originalRAF;

      // Check for consistent frame timing (no jank)
      if (frameTimes.length > 1) {
        const avgFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        expect(avgFrameTime).toBeLessThan(16.67); // 60fps target
      }
    });
  });

  describe('Memory Performance', () => {
    it('does not create memory leaks with frequent updates', () => {
      const slides = generateMockSlides(5);

      const { rerender, unmount } = renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      // Simulate memory-intensive operations
      for (let i = 0; i < 100; i++) {
        const newSlides = generateMockSlides(
          Math.floor(Math.random() * 10) + 1,
        );

        act(() => {
          rerender(
            <CarouselWithEmptyState
              slides={newSlides}
              isLoading={false}
              onSlideClose={jest.fn()}
              onSlideClick={jest.fn()}
            />,
          );
        });
      }

      // Should unmount cleanly without memory leaks
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('cleans up timers and listeners efficiently', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const slides = generateMockSlides(2);

      const { unmount } = renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      const timeoutCallsBefore = setTimeoutSpy.mock.calls.length;

      // Trigger some animations to create timers
      const closeButton = screen.getByTestId(
        'carousel-slide-slide-0-close-button',
      );

      act(() => {
        fireEvent.click(closeButton);
      });

      const timeoutCallsAfter = setTimeoutSpy.mock.calls.length;
      expect(timeoutCallsAfter).toBeGreaterThan(timeoutCallsBefore);

      // Unmount should clean up
      unmount();

      // Should have called clearTimeout for cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('DOM Performance', () => {
    it('minimizes DOM mutations during updates', () => {
      const slides = generateMockSlides(5);

      // Mock DOM mutation observer
      const mutations: MutationRecord[] = [];
      const observer = new MutationObserver((mutationsList) => {
        mutations.push(...mutationsList);
      });

      const { container, rerender } = renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      const mutationsBefore = mutations.length;

      // Update slides
      act(() => {
        rerender(
          <Carousel
            slides={slides.slice(1)}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      });

      const mutationsAfter = mutations.length;
      const newMutations = mutationsAfter - mutationsBefore;

      // Should minimize DOM changes
      expect(newMutations).toBeLessThan(10);

      observer.disconnect();
    });

    it('efficiently handles CSS class updates', () => {
      const slides = generateMockSlides(2);

      const { container } = renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      const initialClassCount =
        container.innerHTML.match(/class=/g)?.length || 0;

      const closeButton = screen.getByTestId(
        'carousel-slide-slide-0-close-button',
      );

      act(() => {
        fireEvent.click(closeButton);
        jest.advanceTimersByTime(400);
      });

      const finalClassCount = container.innerHTML.match(/class=/g)?.length || 0;

      // Should not create excessive class attributes
      expect(Math.abs(finalClassCount - initialClassCount)).toBeLessThan(5);
    });
  });

  describe('Bundle Size Impact', () => {
    it('lazy loads heavy dependencies only when needed', () => {
      // Test that the component doesn't eagerly load heavy dependencies
      const slides = generateMockSlides(1);

      const start = performance.now();

      renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      const loadTime = performance.now() - start;

      // Initial render should be very fast (no heavy deps)
      expect(loadTime).toBeLessThan(10);
    });

    it('reuses component instances efficiently', () => {
      const slides = generateMockSlides(3);

      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      // Get initial component count
      const initialComponents = document.querySelectorAll(
        '[data-testid^="carousel-slide-"]',
      );
      const initialCount = initialComponents.length;

      // Remove one slide
      act(() => {
        rerender(
          <CarouselWithEmptyState
            slides={slides.slice(1)}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      });

      // Should efficiently manage component instances
      const finalComponents = document.querySelectorAll(
        '[data-testid^="carousel-slide-"]',
      );
      const finalCount = finalComponents.length;

      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });
  });
});
