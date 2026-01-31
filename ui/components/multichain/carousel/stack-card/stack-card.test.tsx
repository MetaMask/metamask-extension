import React from 'react';
import { render, screen } from '@testing-library/react';
import { StackCard } from './stack-card';
import type { StackCardProps } from './stack-card.types';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    // Mock translation function
    const translations: Record<string, string> = {
      slideBridgeTitle: 'Bridge your assets',
      slideBridgeDescription:
        'Move your crypto across chains quickly and securely with MetaMask Bridge.',
      closeSlide: 'Close $1',
    };
    return translations[key] || null;
  },
}));

jest.mock('../../../../../shared/modules/shield/constants', () => ({
  SHIELD_CAROUSEL_ID: 'shield-id',
}));

jest.mock('../../../../helpers/constants/routes', () => ({
  SETTINGS_ROUTE: '/settings',
}));

jest.mock('../../../../../shared/lib/deep-links/routes/shield', () => ({
  SHIELD_QUERY_PARAMS: {
    showShieldEntryModal: 'showShieldEntryModal',
  },
}));

describe('StackCard', () => {
  const defaultProps: StackCardProps = {
    slide: {
      id: 'test-slide-1',
      title: 'Test Title',
      description: 'Test Description',
      image: 'https://example.com/image.jpg',
      href: 'https://example.com',
      dismissed: false,
      variableName: 'test',
    },
    isCurrentCard: true,
    isLastSlide: false,
    onSlideClick: jest.fn(),
    onTransitionToNextCard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders slide with literal text from Contentful', () => {
    const contentfulSlide = {
      ...defaultProps.slide,
      id: 'contentful-123',
      title: 'Actual Title Text',
      description: 'Actual Description Text',
    };

    render(<StackCard {...defaultProps} slide={contentfulSlide} />);

    expect(screen.getByText('Actual Title Text')).toBeInTheDocument();
    expect(screen.getByText('Actual Description Text')).toBeInTheDocument();
  });

  it('renders slide with i18n keys from Contentful by translating them', () => {
    const contentfulSlideWithI18nKeys = {
      ...defaultProps.slide,
      id: 'contentful-456',
      title: 'slideBridgeTitle',
      description: 'slideBridgeDescription',
    };

    render(<StackCard {...defaultProps} slide={contentfulSlideWithI18nKeys} />);

    // Should translate the i18n keys
    expect(screen.getByText('Bridge your assets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Move your crypto across chains quickly and securely with MetaMask Bridge.',
      ),
    ).toBeInTheDocument();
  });

  it('renders non-Contentful slide by translating i18n keys', () => {
    const localSlide = {
      ...defaultProps.slide,
      id: 'local-slide',
      title: 'slideBridgeTitle',
      description: 'slideBridgeDescription',
    };

    render(<StackCard {...defaultProps} slide={localSlide} />);

    // Should translate the i18n keys
    expect(screen.getByText('Bridge your assets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Move your crypto across chains quickly and securely with MetaMask Bridge.',
      ),
    ).toBeInTheDocument();
  });

  it('handles Contentful slide with unknown i18n key gracefully', () => {
    const contentfulSlideWithUnknownKey = {
      ...defaultProps.slide,
      id: 'contentful-789',
      title: 'unknownI18nKey',
      description: 'anotherUnknownKey',
    };

    render(
      <StackCard {...defaultProps} slide={contentfulSlideWithUnknownKey} />,
    );

    // Should display the key as-is when translation doesn't exist
    expect(screen.getByText('unknownI18nKey')).toBeInTheDocument();
    expect(screen.getByText('anotherUnknownKey')).toBeInTheDocument();
  });

  it('renders close button with correct aria label', () => {
    const contentfulSlide = {
      ...defaultProps.slide,
      id: 'contentful-close-test',
      title: 'slideBridgeTitle',
    };

    render(<StackCard {...defaultProps} slide={contentfulSlide} />);

    const closeButton = screen.getByTestId(
      'carousel-slide-contentful-close-test-close-button',
    );
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render close button when onTransitionToNextCard is not provided', () => {
    const props = {
      ...defaultProps,
      onTransitionToNextCard: undefined,
    };

    render(<StackCard {...props} />);

    const closeButton = screen.queryByTestId(
      'carousel-slide-test-slide-1-close-button',
    );
    expect(closeButton).not.toBeInTheDocument();
  });

  it('applies correct CSS classes based on card state', () => {
    const { container, rerender } = render(<StackCard {...defaultProps} />);

    // Current card
    expect(container.querySelector('.carousel-card--current')).toBeInTheDocument();
    expect(container.querySelector('.carousel-card--next')).not.toBeInTheDocument();

    // Next card
    rerender(<StackCard {...defaultProps} isCurrentCard={false} />);
    expect(container.querySelector('.carousel-card--next')).toBeInTheDocument();
    expect(container.querySelector('.carousel-card--current')).not.toBeInTheDocument();
  });

  it('renders pressed overlay for non-current cards', () => {
    const { container } = render(
      <StackCard {...defaultProps} isCurrentCard={false} />,
    );

    expect(
      container.querySelector('.carousel-card__pressed-overlay'),
    ).toBeInTheDocument();
  });

  it('does not render pressed overlay for current card', () => {
    const { container } = render(
      <StackCard {...defaultProps} isCurrentCard={true} />,
    );

    expect(
      container.querySelector('.carousel-card__pressed-overlay'),
    ).not.toBeInTheDocument();
  });
});
