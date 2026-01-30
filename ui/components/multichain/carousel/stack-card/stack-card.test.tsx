import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CarouselSlide } from '../../../../../shared/constants/app-state';
import { StackCard } from './stack-card';

// Mock the useI18nContext hook
const mockT = jest.fn((key: string) => {
  // Simulate missing translations by returning null for certain keys
  if (key === 'slideDebitCardTitle' || key === 'slideBridgeTitle') {
    return null;
  }
  if (key === 'closeSlide') {
    return 'Close $1';
  }
  return key;
});

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

describe('StackCard', () => {
  const mockOnTransitionToNextCard = jest.fn();
  const mockOnSlideClick = jest.fn();

  const contentfulSlide: CarouselSlide = {
    id: 'contentful-123',
    title: 'Contentful Title',
    description: 'Contentful Description',
    image: 'https://example.com/image.jpg',
  };

  const regularSlide: CarouselSlide = {
    id: 'regular-slide',
    title: 'regularSlideTitle',
    description: 'regularSlideDescription',
    image: 'https://example.com/image.jpg',
  };

  const slideWithMissingTranslation: CarouselSlide = {
    id: 'missing-translation',
    title: 'slideDebitCardTitle',
    description: 'slideDebitCardDescription',
    image: 'https://example.com/image.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing for contentful slide', () => {
    render(
      <StackCard
        slide={contentfulSlide}
        isCurrentCard={true}
        onTransitionToNextCard={mockOnTransitionToNextCard}
      />,
    );

    expect(screen.getByText('Contentful Title')).toBeInTheDocument();
    expect(screen.getByText('Contentful Description')).toBeInTheDocument();
  });

  it('renders without crashing for regular slide', () => {
    render(
      <StackCard
        slide={regularSlide}
        isCurrentCard={true}
        onTransitionToNextCard={mockOnTransitionToNextCard}
      />,
    );

    expect(screen.getByText('regularSlideTitle')).toBeInTheDocument();
    expect(screen.getByText('regularSlideDescription')).toBeInTheDocument();
  });

  it('handles missing translations gracefully by falling back to original key', () => {
    render(
      <StackCard
        slide={slideWithMissingTranslation}
        isCurrentCard={true}
        onTransitionToNextCard={mockOnTransitionToNextCard}
      />,
    );

    // Should display the original key when translation is missing
    expect(screen.getByText('slideDebitCardTitle')).toBeInTheDocument();
    expect(screen.getByText('slideDebitCardDescription')).toBeInTheDocument();
  });

  it('renders close button with proper aria label for contentful slide', () => {
    render(
      <StackCard
        slide={contentfulSlide}
        isCurrentCard={true}
        onTransitionToNextCard={mockOnTransitionToNextCard}
      />,
    );

    const closeButton = screen.getByTestId(
      'carousel-slide-contentful-123-close-button',
    );
    expect(closeButton).toBeInTheDocument();
  });

  it('renders close button with fallback for missing translation in aria label', () => {
    render(
      <StackCard
        slide={slideWithMissingTranslation}
        isCurrentCard={true}
        onTransitionToNextCard={mockOnTransitionToNextCard}
      />,
    );

    const closeButton = screen.getByTestId(
      'carousel-slide-missing-translation-close-button',
    );
    expect(closeButton).toBeInTheDocument();
    // The button should render without errors even though translation is missing
  });

  it('calls onTransitionToNextCard when close button is clicked', () => {
    render(
      <StackCard
        slide={contentfulSlide}
        isCurrentCard={true}
        isLastSlide={false}
        onTransitionToNextCard={mockOnTransitionToNextCard}
      />,
    );

    const closeButton = screen.getByTestId(
      'carousel-slide-contentful-123-close-button',
    );
    fireEvent.click(closeButton);

    expect(mockOnTransitionToNextCard).toHaveBeenCalledWith(
      'contentful-123',
      false,
    );
  });

  it('does not render close button when onTransitionToNextCard is not provided', () => {
    render(<StackCard slide={contentfulSlide} isCurrentCard={true} />);

    const closeButton = screen.queryByTestId(
      'carousel-slide-contentful-123-close-button',
    );
    expect(closeButton).not.toBeInTheDocument();
  });

  it('calls onSlideClick when card is clicked and is current card', () => {
    const slideWithHref = {
      ...contentfulSlide,
      href: 'https://example.com',
    };

    render(
      <StackCard
        slide={slideWithHref}
        isCurrentCard={true}
        onSlideClick={mockOnSlideClick}
      />,
    );

    const card = screen.getByTestId('carousel-slide-contentful-123');
    fireEvent.click(card);

    expect(mockOnSlideClick).toHaveBeenCalledWith('contentful-123', {
      type: 'external',
      href: 'https://example.com',
    });
  });

  it('does not call onSlideClick when card is not current', () => {
    render(
      <StackCard
        slide={contentfulSlide}
        isCurrentCard={false}
        onSlideClick={mockOnSlideClick}
      />,
    );

    const card = screen.getByTestId('carousel-slide-contentful-123');
    fireEvent.click(card);

    expect(mockOnSlideClick).not.toHaveBeenCalled();
  });

  it('applies correct classes for current card', () => {
    render(<StackCard slide={contentfulSlide} isCurrentCard={true} />);

    const card = screen.getByTestId('carousel-slide-contentful-123');
    expect(card).toHaveClass('carousel-card--current');
  });

  it('applies correct classes for next card', () => {
    render(<StackCard slide={contentfulSlide} isCurrentCard={false} />);

    const card = screen.getByTestId('carousel-slide-contentful-123');
    expect(card).toHaveClass('carousel-card--next');
  });
});
