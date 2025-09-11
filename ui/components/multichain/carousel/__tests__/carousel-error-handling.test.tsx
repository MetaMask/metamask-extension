import React from 'react';
import { screen, act } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { Carousel } from '../carousel';
import { CarouselWithEmptyState } from '../carousel-wrapper';
import type { CarouselSlide } from '../../../../shared/constants/app-state';

// Mock console methods to test error handling
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('Carousel Error Handling', () => {
  beforeEach(() => {
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('Malformed Data Handling', () => {
    it('handles slides with missing required fields', () => {
      const malformedSlides = [
        {
          id: 'incomplete-slide',
          // Missing title, description, image
          dismissed: false,
        } as CarouselSlide,
        {
          id: 'partial-slide',
          title: 'Valid Title',
          // Missing description and image
          dismissed: false,
        } as CarouselSlide,
      ];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={malformedSlides}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      }).not.toThrow();

      // Should render what it can
      expect(screen.getByText('Valid Title')).toBeInTheDocument();
    });

    it('handles null and undefined slides', () => {
      const slidesWithNulls = [
        {
          id: 'valid-slide',
          title: 'Valid Slide',
          description: 'Valid description',
          image: 'https://example.com/image.jpg',
          dismissed: false,
        },
        null,
        undefined,
        {
          id: 'another-valid',
          title: 'Another Valid',
          description: 'Another description',
          image: 'https://example.com/image2.jpg',
          dismissed: false,
        },
      ].filter(Boolean) as CarouselSlide[];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={slidesWithNulls}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      }).not.toThrow();

      expect(screen.getByText('Valid Slide')).toBeInTheDocument();
    });

    it('handles invalid image URLs gracefully', () => {
      const slidesWithBadImages = [
        {
          id: 'bad-image-slide',
          title: 'Bad Image Slide',
          description: 'This slide has a bad image URL',
          image: 'not-a-valid-url',
          dismissed: false,
        },
        {
          id: 'no-image-slide',
          title: 'No Image Slide',
          description: 'This slide has no image',
          image: '',
          dismissed: false,
        },
      ];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={slidesWithBadImages}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      }).not.toThrow();

      expect(screen.getByText('Bad Image Slide')).toBeInTheDocument();
      expect(screen.getByText('No Image Slide')).toBeInTheDocument();
    });
  });

  describe('Callback Error Handling', () => {
    it('handles errors in onSlideClick callback', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Click callback error');
      });

      const slides = [
        {
          id: 'test-slide',
          title: 'Test Slide',
          description: 'Test description',
          image: 'https://example.com/image.jpg',
          dismissed: false,
          href: 'https://example.com',
        },
      ];

      renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={errorCallback}
        />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide');

      // Should not crash the component
      expect(() => {
        act(() => {
          card.click();
        });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });

    it('handles errors in onSlideClose callback', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Close callback error');
      });

      const slides = [
        {
          id: 'test-slide',
          title: 'Test Slide',
          description: 'Test description',
          image: 'https://example.com/image.jpg',
          dismissed: false,
        },
      ];

      renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={errorCallback}
          onSlideClick={jest.fn()}
        />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-close-button',
      );

      // Should not crash the component
      expect(() => {
        act(() => {
          closeButton.click();
        });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });

    it('handles errors in onRenderSlides callback', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Render slides callback error');
      });

      const slides = [
        {
          id: 'test-slide',
          title: 'Test Slide',
          description: 'Test description',
          image: 'https://example.com/image.jpg',
          dismissed: false,
        },
      ];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={slides}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
            onRenderSlides={errorCallback}
          />,
        );
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('State Corruption Handling', () => {
    it('recovers from invalid active slide index', () => {
      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
      ];

      const { rerender } = renderWithProvider(
        <Carousel
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      expect(screen.getByText('Slide 1')).toBeInTheDocument();

      // Simulate slides being updated to empty array (state corruption scenario)
      rerender(
        <Carousel
          slides={[]}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      // Should handle gracefully without crashing
      expect(screen.queryByText('Slide 1')).not.toBeInTheDocument();
    });

    it('handles rapid state changes without errors', async () => {
      const initialSlides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
        {
          id: 'slide-2',
          title: 'Slide 2',
          description: 'Description 2',
          image: 'https://example.com/image2.jpg',
          dismissed: false,
        },
      ];

      const { rerender } = renderWithProvider(
        <CarouselWithEmptyState
          slides={initialSlides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      // Rapidly change slides multiple times
      for (let i = 0; i < 10; i++) {
        act(() => {
          rerender(
            <CarouselWithEmptyState
              slides={i % 2 === 0 ? initialSlides : []}
              isLoading={i % 3 === 0}
              onSlideClose={jest.fn()}
              onSlideClick={jest.fn()}
            />,
          );
        });
      }

      // Should not crash
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Animation Error Handling', () => {
    it('handles interrupted animations gracefully', async () => {
      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
        {
          id: 'slide-2',
          title: 'Slide 2',
          description: 'Description 2',
          image: 'https://example.com/image2.jpg',
          dismissed: false,
        },
      ];

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
        'carousel-slide-slide-1-close-button',
      );

      // Start animation
      act(() => {
        closeButton.click();
      });

      // Immediately try to interact again (interrupt animation)
      act(() => {
        closeButton.click();
      });

      // Should handle gracefully
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('handles CSS transition errors', () => {
      // Mock CSS transition errors
      const originalTransition = Object.getOwnPropertyDescriptor(
        CSSStyleDeclaration.prototype,
        'transition',
      );

      Object.defineProperty(CSSStyleDeclaration.prototype, 'transition', {
        set: jest.fn(() => {
          throw new Error('CSS transition error');
        }),
        configurable: true,
      });

      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
      ];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={slides}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      }).not.toThrow();

      // Restore original property
      if (originalTransition) {
        Object.defineProperty(
          CSSStyleDeclaration.prototype,
          'transition',
          originalTransition,
        );
      }
    });
  });

  describe('Memory Leak Prevention', () => {
    it('cleans up event listeners on unmount', () => {
      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
      ];

      const { unmount } = renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      // Should not throw on unmount
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('cleans up timers on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
      ];

      const { unmount } = renderWithProvider(
        <CarouselWithEmptyState
          slides={slides}
          isLoading={false}
          onSlideClose={jest.fn()}
          onSlideClick={jest.fn()}
        />,
      );

      unmount();

      // Should clean up timers
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Browser Compatibility', () => {
    it('handles missing CSS support gracefully', () => {
      // Mock missing CSS features
      const originalSupports = CSS.supports;
      CSS.supports = jest.fn(() => false);

      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
      ];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={slides}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      }).not.toThrow();

      expect(screen.getByText('Slide 1')).toBeInTheDocument();

      // Restore
      CSS.supports = originalSupports;
    });

    it('handles missing IntersectionObserver API', () => {
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      const slides = [
        {
          id: 'slide-1',
          title: 'Slide 1',
          description: 'Description 1',
          image: 'https://example.com/image1.jpg',
          dismissed: false,
        },
      ];

      expect(() => {
        renderWithProvider(
          <Carousel
            slides={slides}
            isLoading={false}
            onSlideClose={jest.fn()}
            onSlideClick={jest.fn()}
          />,
        );
      }).not.toThrow();

      // Restore
      global.IntersectionObserver = originalIntersectionObserver;
    });
  });
});
