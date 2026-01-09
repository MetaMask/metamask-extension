/**
 * Integration test to verify the translation fallback fix
 * for the StackCard component resolves the following errors:
 * - Unable to find value of key "slideBridgeTitle" for locale "en"
 * - Unable to find value of key "slideDebitCardTitle" for locale "en"
 * - Unable to find value of key "slideDebitCardDescription" for locale "en"
 * - Unable to find value of key "slideBridgeDescription" for locale "en"
 * - Insufficient number of substitutions for key "closeSlide" with locale "en"
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StackCard } from '../stack-card';
import type { CarouselSlide } from '../../../../../shared/constants/app-state';

// Mock the i18n context to simulate missing translation keys
const mockT = jest.fn((key: string, substitutions?: unknown[]) => {
  const translations: Record<string, string> = {
    closeSlide: substitutions ? `Close ${substitutions[0]}` : 'Close',
    // Note: slideBridgeTitle, slideDebitCardTitle, etc. are intentionally missing
  };

  // Simulate real i18n behavior: return null for missing keys
  return translations[key] ?? null;
});

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

global.platform = {
  openTab: jest.fn(),
} as never;

describe('StackCard - Translation Fallback Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fix for "Unable to find value of key" errors', () => {
    const testCases: Array<{
      name: string;
      slide: CarouselSlide;
      expectedTitle: string;
      expectedDescription: string;
    }> = [
      {
        name: 'slideBridgeTitle and slideBridgeDescription',
        slide: {
          id: 'bridge-slide',
          title: 'slideBridgeTitle',
          description: 'slideBridgeDescription',
          image: 'https://example.com/bridge.jpg',
        },
        expectedTitle: 'slideBridgeTitle',
        expectedDescription: 'slideBridgeDescription',
      },
      {
        name: 'slideDebitCardTitle and slideDebitCardDescription',
        slide: {
          id: 'debit-card-slide',
          title: 'slideDebitCardTitle',
          description: 'slideDebitCardDescription',
          image: 'https://example.com/debit.jpg',
        },
        expectedTitle: 'slideDebitCardTitle',
        expectedDescription: 'slideDebitCardDescription',
      },
    ];

    testCases.forEach(({ name, slide, expectedTitle, expectedDescription }) => {
      it(`should gracefully handle missing translation keys: ${name}`, () => {
        // This test verifies that the component does not throw when translation keys are missing
        expect(() => {
          render(
            <StackCard
              slide={slide}
              isCurrentCard={true}
              onTransitionToNextCard={jest.fn()}
            />,
          );
        }).not.toThrow();

        // Verify fallback values are displayed
        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        expect(screen.getByText(expectedDescription)).toBeInTheDocument();

        // Verify translation was attempted
        expect(mockT).toHaveBeenCalledWith(slide.title);
        expect(mockT).toHaveBeenCalledWith(slide.description);
      });
    });
  });

  describe('Fix for "Insufficient number of substitutions" error', () => {
    it('should provide valid substitution (not null) to closeSlide translation', () => {
      const slide: CarouselSlide = {
        id: 'test-slide',
        title: 'slideBridgeTitle', // Missing translation key
        description: 'Test description',
        image: 'https://example.com/test.jpg',
      };

      render(
        <StackCard
          slide={slide}
          isCurrentCard={true}
          onTransitionToNextCard={jest.fn()}
        />,
      );

      // Verify closeSlide is called with the fallback title (not null)
      expect(mockT).toHaveBeenCalledWith('closeSlide', ['slideBridgeTitle']);

      // Verify the close button has proper aria-label
      const closeButton = screen.getByTestId('carousel-slide-test-slide-close-button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close slideBridgeTitle');
    });

    it('should not throw when using fallback title in closeSlide', () => {
      const slide: CarouselSlide = {
        id: 'another-slide',
        title: 'slideDebitCardTitle', // Missing translation key
        description: 'Test description',
        image: 'https://example.com/test.jpg',
      };

      // Should not throw
      expect(() => {
        render(
          <StackCard
            slide={slide}
            isCurrentCard={true}
            onTransitionToNextCard={jest.fn()}
          />,
        );
      }).not.toThrow();

      // Verify proper substitution
      expect(mockT).toHaveBeenCalledWith('closeSlide', ['slideDebitCardTitle']);
    });
  });

  describe('Contentful slides should not be affected', () => {
    it('should use raw content for Contentful slides without translation', () => {
      const contentfulSlide: CarouselSlide = {
        id: 'contentful-xyz',
        title: 'Bridge Your Assets',
        description: 'Cross-chain bridging made easy',
        image: 'https://example.com/contentful.jpg',
      };

      render(
        <StackCard
          slide={contentfulSlide}
          isCurrentCard={true}
          onTransitionToNextCard={jest.fn()}
        />,
      );

      // Should display raw content
      expect(screen.getByText('Bridge Your Assets')).toBeInTheDocument();
      expect(screen.getByText('Cross-chain bridging made easy')).toBeInTheDocument();

      // Should not attempt translation for title/description
      expect(mockT).not.toHaveBeenCalledWith('Bridge Your Assets');
      expect(mockT).not.toHaveBeenCalledWith('Cross-chain bridging made easy');

      // Should only call translation for closeSlide
      expect(mockT).toHaveBeenCalledWith('closeSlide', ['Bridge Your Assets']);
    });
  });
});
