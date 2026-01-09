import React from 'react';
import { render, screen } from '@testing-library/react';
import { StackCard } from './stack-card';

// Mock the i18n context
const mockT = jest.fn((key: string, substitutions?: unknown[]) => {
  // Simulate translation behavior
  const translations: Record<string, string> = {
    closeSlide: substitutions ? `Close ${substitutions[0]}` : 'Close',
    validKey: 'Valid Translation',
  };

  // Return translation if exists, otherwise return null (mimicking real behavior)
  return translations[key] ?? null;
});

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

// Mock global.platform
global.platform = {
  openTab: jest.fn(),
} as never;

describe('StackCard', () => {
  const defaultProps = {
    slide: {
      id: 'test-slide',
      title: 'Test Title',
      description: 'Test Description',
      image: 'https://example.com/image.jpg',
    },
    isCurrentCard: true,
    isLastSlide: false,
    onSlideClick: jest.fn(),
    onTransitionToNextCard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contentful slides', () => {
    it('displays raw title and description for Contentful slides', () => {
      const contentfulSlide = {
        ...defaultProps,
        slide: {
          ...defaultProps.slide,
          id: 'contentful-abc123',
          title: 'Contentful Title',
          description: 'Contentful Description',
        },
      };

      render(<StackCard {...contentfulSlide} />);

      // Should display raw content without translation
      expect(screen.getByText('Contentful Title')).toBeInTheDocument();
      expect(screen.getByText('Contentful Description')).toBeInTheDocument();

      // Translation function should not be called for title/description
      expect(mockT).not.toHaveBeenCalledWith('Contentful Title');
      expect(mockT).not.toHaveBeenCalledWith('Contentful Description');
    });

    it('uses raw title in closeSlide aria label for Contentful slides', () => {
      const contentfulSlide = {
        ...defaultProps,
        slide: {
          ...defaultProps.slide,
          id: 'contentful-abc123',
          title: 'My Title',
        },
      };

      render(<StackCard {...contentfulSlide} />);

      // closeSlide should be called with the raw title
      expect(mockT).toHaveBeenCalledWith('closeSlide', ['My Title']);
    });
  });

  describe('Non-Contentful slides with valid translation keys', () => {
    it('translates title and description when translation keys exist', () => {
      const nonContentfulSlide = {
        ...defaultProps,
        slide: {
          ...defaultProps.slide,
          id: 'local-slide',
          title: 'validKey',
          description: 'validKey',
        },
      };

      render(<StackCard {...nonContentfulSlide} />);

      // Should display translated content
      expect(screen.getByText('Valid Translation')).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith('validKey');
    });
  });

  describe('Non-Contentful slides with invalid translation keys', () => {
    it('falls back to raw key when translation does not exist', () => {
      const nonContentfulSlide = {
        ...defaultProps,
        slide: {
          ...defaultProps.slide,
          id: 'local-slide',
          title: 'slideBridgeTitle',
          description: 'slideBridgeDescription',
        },
      };

      render(<StackCard {...nonContentfulSlide} />);

      // Should display the raw key as fallback
      expect(screen.getByText('slideBridgeTitle')).toBeInTheDocument();
      expect(screen.getByText('slideBridgeDescription')).toBeInTheDocument();

      // Translation should have been attempted
      expect(mockT).toHaveBeenCalledWith('slideBridgeTitle');
      expect(mockT).toHaveBeenCalledWith('slideBridgeDescription');
    });

    it('uses fallback title in closeSlide aria label', () => {
      const nonContentfulSlide = {
        ...defaultProps,
        slide: {
          ...defaultProps.slide,
          id: 'local-slide',
          title: 'slideBridgeTitle',
        },
      };

      render(<StackCard {...nonContentfulSlide} />);

      // closeSlide should be called with the fallback title (not null)
      expect(mockT).toHaveBeenCalledWith('closeSlide', ['slideBridgeTitle']);

      // Verify the aria label is set correctly
      const closeButton = screen.getByTestId('carousel-slide-local-slide-close-button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close slideBridgeTitle');
    });
  });

  describe('Close button', () => {
    it('does not render close button when onTransitionToNextCard is not provided', () => {
      const propsWithoutClose = {
        ...defaultProps,
        onTransitionToNextCard: undefined,
      };

      render(<StackCard {...propsWithoutClose} />);

      expect(
        screen.queryByTestId(`carousel-slide-${defaultProps.slide.id}-close-button`),
      ).not.toBeInTheDocument();
    });

    it('renders close button when onTransitionToNextCard is provided', () => {
      render(<StackCard {...defaultProps} />);

      expect(
        screen.getByTestId(`carousel-slide-${defaultProps.slide.id}-close-button`),
      ).toBeInTheDocument();
    });
  });

  describe('Image alt text', () => {
    it('uses translated/fallback title for image alt text', () => {
      const slideWithInvalidKey = {
        ...defaultProps,
        slide: {
          ...defaultProps.slide,
          id: 'test',
          title: 'invalidKey',
        },
      };

      render(<StackCard {...slideWithInvalidKey} />);

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'invalidKey');
    });
  });
});
