import React from 'react';
import { render, screen } from '@testing-library/react';
import type { CarouselSlide } from '../../../../../shared/constants/app-state';
import { StackCard } from './stack-card';

// Mock the i18n hook
const mockT = jest.fn((key: string) => {
  // Simulate i18n behavior: return null for missing keys
  const translations: Record<string, string> = {
    closeSlide: 'Close $1',
    // Note: we intentionally don't have slideSmartAccountUpgradeTitle, etc.
  };
  return translations[key] || null;
});

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

// Mock the platform API
global.platform = {
  openTab: jest.fn(),
} as unknown as typeof global.platform;

describe('StackCard', () => {
  const baseSlide: CarouselSlide = {
    id: 'test-slide',
    title: 'Test Title',
    description: 'Test Description',
    image: 'https://example.com/image.jpg',
  };

  const defaultProps = {
    slide: baseSlide,
    isCurrentCard: true,
    isLastSlide: false,
    onSlideClick: jest.fn(),
    onTransitionToNextCard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contentful slides (ID starts with "contentful-")', () => {
    it('displays title and description as-is for contentful slides', () => {
      const contentfulSlide: CarouselSlide = {
        ...baseSlide,
        id: 'contentful-123',
        title: 'Contentful Title',
        description: 'Contentful Description',
      };

      render(<StackCard {...defaultProps} slide={contentfulSlide} />);

      expect(screen.getByText('Contentful Title')).toBeInTheDocument();
      expect(screen.getByText('Contentful Description')).toBeInTheDocument();
      // Should not try to translate contentful content
      expect(mockT).not.toHaveBeenCalledWith('Contentful Title');
      expect(mockT).not.toHaveBeenCalledWith('Contentful Description');
    });
  });

  describe('Non-Contentful slides with missing i18n keys', () => {
    it('displays original title when translation returns null', () => {
      const slideWithMissingKey: CarouselSlide = {
        ...baseSlide,
        id: 'non-contentful-slide',
        title: 'slideSmartAccountUpgradeTitle',
        description: 'slideSmartAccountUpgradeDescription',
      };

      render(<StackCard {...defaultProps} slide={slideWithMissingKey} />);

      // Should attempt to translate
      expect(mockT).toHaveBeenCalledWith('slideSmartAccountUpgradeTitle');
      expect(mockT).toHaveBeenCalledWith('slideSmartAccountUpgradeDescription');

      // Should fall back to displaying original text since translation returned null
      expect(
        screen.getByText('slideSmartAccountUpgradeTitle'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('slideSmartAccountUpgradeDescription'),
      ).toBeInTheDocument();
    });

    it('handles close button aria-label with fallback text', () => {
      const slideWithMissingKey: CarouselSlide = {
        ...baseSlide,
        id: 'non-contentful-slide',
        title: 'slideSmartAccountUpgradeTitle',
        description: 'slideSmartAccountUpgradeDescription',
      };

      render(<StackCard {...defaultProps} slide={slideWithMissingKey} />);

      const closeButton = screen.getByTestId(
        'carousel-slide-non-contentful-slide-close-button',
      );

      // Should use the fallback title in aria-label
      expect(mockT).toHaveBeenCalledWith('closeSlide', [
        'slideSmartAccountUpgradeTitle',
      ]);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Non-Contentful slides with valid i18n keys', () => {
    it('displays translated text when translation succeeds', () => {
      // Add a translation for this test
      mockT.mockImplementationOnce((key: string) => {
        if (key === 'validKey') {
          return 'Translated Title';
        }
        return null;
      });
      mockT.mockImplementationOnce((key: string) => {
        if (key === 'validDescriptionKey') {
          return 'Translated Description';
        }
        return null;
      });

      const slideWithValidKey: CarouselSlide = {
        ...baseSlide,
        id: 'non-contentful-slide',
        title: 'validKey',
        description: 'validDescriptionKey',
      };

      render(<StackCard {...defaultProps} slide={slideWithValidKey} />);

      expect(screen.getByText('Translated Title')).toBeInTheDocument();
      expect(screen.getByText('Translated Description')).toBeInTheDocument();
    });
  });

  describe('Image rendering', () => {
    it('uses display title for image alt text', () => {
      const slide: CarouselSlide = {
        ...baseSlide,
        id: 'test-slide',
        title: 'Image Test Title',
      };

      render(<StackCard {...defaultProps} slide={slide} />);

      const image = screen.getByAltText('Image Test Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', slide.image);
    });
  });

  describe('Click handling', () => {
    it('calls onSlideClick when current card is clicked', () => {
      const onSlideClick = jest.fn();
      render(
        <StackCard
          {...defaultProps}
          slide={baseSlide}
          onSlideClick={onSlideClick}
          isCurrentCard={true}
        />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide');
      card.click();

      expect(onSlideClick).toHaveBeenCalledWith('test-slide', {
        type: 'internal',
        href: undefined,
      });
    });

    it('does not call onSlideClick when non-current card is clicked', () => {
      const onSlideClick = jest.fn();
      render(
        <StackCard
          {...defaultProps}
          slide={baseSlide}
          onSlideClick={onSlideClick}
          isCurrentCard={false}
        />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide');
      card.click();

      expect(onSlideClick).not.toHaveBeenCalled();
    });

    it('opens external link when slide has href', () => {
      const slideWithLink: CarouselSlide = {
        ...baseSlide,
        href: 'https://example.com',
      };

      render(<StackCard {...defaultProps} slide={slideWithLink} />);

      const card = screen.getByTestId('carousel-slide-test-slide');
      card.click();

      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://example.com',
      });
    });
  });

  describe('Close button', () => {
    it('renders close button when onTransitionToNextCard is provided', () => {
      render(<StackCard {...defaultProps} />);

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-close-button',
      );
      expect(closeButton).toBeInTheDocument();
    });

    it('does not render close button when onTransitionToNextCard is not provided', () => {
      render(
        <StackCard {...defaultProps} onTransitionToNextCard={undefined} />,
      );

      const closeButton = screen.queryByTestId(
        'carousel-slide-test-slide-close-button',
      );
      expect(closeButton).not.toBeInTheDocument();
    });

    it('calls onTransitionToNextCard when close button is clicked', () => {
      const onTransitionToNextCard = jest.fn();
      render(
        <StackCard
          {...defaultProps}
          onTransitionToNextCard={onTransitionToNextCard}
        />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-close-button',
      );
      closeButton.click();

      expect(onTransitionToNextCard).toHaveBeenCalledWith('test-slide', false);
    });
  });

  describe('Card styling', () => {
    it('applies current card class when isCurrentCard is true', () => {
      render(<StackCard {...defaultProps} isCurrentCard={true} />);

      const card = screen.getByTestId('carousel-slide-test-slide');
      expect(card).toHaveClass('carousel-card--current');
      expect(card).not.toHaveClass('carousel-card--next');
    });

    it('applies next card class when isCurrentCard is false', () => {
      render(<StackCard {...defaultProps} isCurrentCard={false} />);

      const card = screen.getByTestId('carousel-slide-test-slide');
      expect(card).toHaveClass('carousel-card--next');
      expect(card).not.toHaveClass('carousel-card--current');
    });

    it('applies custom className', () => {
      render(<StackCard {...defaultProps} className="custom-class" />);

      const card = screen.getByTestId('carousel-slide-test-slide');
      expect(card).toHaveClass('custom-class');
    });
  });
});
