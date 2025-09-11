import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { StackCard } from '../stack-card';
import type { CarouselSlide } from '../../../../../shared/constants/app-state';

const mockSlide: CarouselSlide = {
  id: 'test-slide-1',
  title: 'Test Slide Title',
  description:
    'Test slide description that might be quite long and should truncate properly',
  image: 'https://example.com/test-image.jpg',
  dismissed: false,
  href: 'https://example.com/test-link',
  variableName: 'test',
};

const mockContentfulSlide: CarouselSlide = {
  id: 'contentful-test-slide',
  title: 'Contentful Slide Title',
  description: 'Contentful slide description',
  image: 'https://example.com/contentful-image.jpg',
  dismissed: false,
  variableName: 'contentful',
};

describe('StackCard', () => {
  const defaultProps = {
    slide: mockSlide,
    isCurrentCard: true,
    isLastSlide: false,
    onSlideClick: jest.fn(),
    onTransitionToNextCard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders slide content correctly', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      expect(screen.getByText('Test Slide Title')).toBeInTheDocument();
      expect(screen.getByText(/Test slide description/)).toBeInTheDocument();
      expect(screen.getByAltText('Test Slide Title')).toBeInTheDocument();
    });

    it('applies current card styling when isCurrentCard is true', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      expect(card).toHaveClass('carousel-card--current');
    });

    it('applies next card styling when isCurrentCard is false', () => {
      renderWithProvider(<StackCard {...defaultProps} isCurrentCard={false} />);

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      expect(card).toHaveClass('carousel-card--next');
    });

    it('shows pressed overlay for next cards', () => {
      renderWithProvider(<StackCard {...defaultProps} isCurrentCard={false} />);

      expect(
        document.querySelector('.carousel-card__pressed-overlay'),
      ).toBeInTheDocument();
    });

    it('does not show pressed overlay for current cards', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      expect(
        document.querySelector('.carousel-card__pressed-overlay'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('renders close button when onTransitionToNextCard is provided', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      expect(
        screen.getByTestId('carousel-slide-test-slide-1-close-button'),
      ).toBeInTheDocument();
    });

    it('does not render close button when onTransitionToNextCard is not provided', () => {
      renderWithProvider(
        <StackCard {...defaultProps} onTransitionToNextCard={undefined} />,
      );

      expect(
        screen.queryByTestId('carousel-slide-test-slide-1-close-button'),
      ).not.toBeInTheDocument();
    });

    it('calls onTransitionToNextCard when close button is clicked', () => {
      const onTransitionMock = jest.fn();
      renderWithProvider(
        <StackCard
          {...defaultProps}
          onTransitionToNextCard={onTransitionMock}
        />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      expect(onTransitionMock).toHaveBeenCalledWith('test-slide-1', false);
    });

    it('passes correct isLastSlide value to transition handler', () => {
      const onTransitionMock = jest.fn();
      renderWithProvider(
        <StackCard
          {...defaultProps}
          isLastSlide={true}
          onTransitionToNextCard={onTransitionMock}
        />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      expect(onTransitionMock).toHaveBeenCalledWith('test-slide-1', true);
    });

    it('prevents event propagation on close button click', () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <StackCard {...defaultProps} onSlideClick={onSlideClickMock} />,
      );

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      fireEvent.click(closeButton);

      expect(onSlideClickMock).not.toHaveBeenCalled();
    });
  });

  describe('Card Click Interactions', () => {
    it('calls onSlideClick when card is clicked', () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <StackCard {...defaultProps} onSlideClick={onSlideClickMock} />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      fireEvent.click(card);

      expect(onSlideClickMock).toHaveBeenCalledWith('test-slide-1', {
        type: 'external',
        href: 'https://example.com/test-link',
      });
    });

    it('opens external link when card has href', () => {
      const mockOpenTab = jest.fn();

      // Mock only what we need
      (global as any).platform = { openTab: mockOpenTab };

      renderWithProvider(<StackCard {...defaultProps} />);

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      fireEvent.click(card);

      expect(mockOpenTab).toHaveBeenCalledWith({
        url: 'https://example.com/test-link',
      });
    });

    it('does not trigger actions when clicked as next card', () => {
      const onSlideClickMock = jest.fn();
      renderWithProvider(
        <StackCard
          {...defaultProps}
          isCurrentCard={false}
          onSlideClick={onSlideClickMock}
        />,
      );

      const card = screen.getByTestId('carousel-slide-test-slide-1');
      fireEvent.click(card);

      expect(onSlideClickMock).not.toHaveBeenCalled();
    });
  });

  describe('Content Handling', () => {
    it('handles contentful slides correctly', () => {
      renderWithProvider(
        <StackCard {...defaultProps} slide={mockContentfulSlide} />,
      );

      // Should display title and description directly (not through translation)
      expect(screen.getByText('Contentful Slide Title')).toBeInTheDocument();
      expect(
        screen.getByText('Contentful slide description'),
      ).toBeInTheDocument();
    });

    it('handles non-contentful slides with translation', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      // Should use translation for title and description
      // Note: In tests, t() function returns the key if translation doesn't exist
      expect(screen.getByText('Test Slide Title')).toBeInTheDocument();
    });
  });

  describe('Design System Integration', () => {
    it('uses Text components from design system', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      const titleElement = screen.getByText('Test Slide Title');
      const descriptionElement = screen.getByText(/Test slide description/);

      // Should be rendered as Text components (check for specific className)
      expect(titleElement).toHaveClass('carousel-card__title');
      expect(descriptionElement).toHaveClass('carousel-card__description');
    });

    it('uses ButtonIcon component correctly', () => {
      renderWithProvider(<StackCard {...defaultProps} />);

      const closeButton = screen.getByTestId(
        'carousel-slide-test-slide-1-close-button',
      );
      expect(closeButton).toHaveClass('mm-button-icon');
      expect(closeButton).toHaveClass('mm-button-icon--size-md');
    });
  });

  describe('Responsive Behavior', () => {
    it('truncates long titles properly', () => {
      const longTitleSlide = {
        ...mockSlide,
        title:
          'This is a very long title that should be truncated with ellipsis',
      };

      renderWithProvider(
        <StackCard {...defaultProps} slide={longTitleSlide} />,
      );

      const titleElement = screen.getByText(/This is a very long title/);
      expect(titleElement).toHaveClass('carousel-card__title');
    });

    it('truncates long descriptions to 2 lines', () => {
      const longDescSlide = {
        ...mockSlide,
        description:
          'This is a very long description that should be truncated to exactly two lines and show ellipsis when the content exceeds the available space in the card',
      };

      renderWithProvider(<StackCard {...defaultProps} slide={longDescSlide} />);

      const descElement = screen.getByText(/This is a very long description/);
      expect(descElement).toHaveClass('carousel-card__description');
    });
  });
});
