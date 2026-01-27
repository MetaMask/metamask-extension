import React from 'react';
import { render, screen } from '@testing-library/react';
import { StackCard } from './stack-card';

// Mock the i18n hook
const mockT = jest.fn((key: string, substitutions?: string[]) => {
  // Simulate the behavior where some keys exist and some don't
  const translations: Record<string, string> = {
    slideSmartAccountUpgradeTitle: 'Switch to smart account',
    slideSmartAccountUpgradeDescription:
      'Upgrade to a smart account for faster transactions, lower fees, and more flexibility in payments.',
    slideBridgeTitle: 'Bridge your assets',
    slideBridgeDescription:
      'Move your assets between networks seamlessly and securely with MetaMask Bridge.',
    closeSlide: 'Close $1',
  };

  const translation = translations[key];
  if (!translation) {
    return null;
  }

  // Handle substitutions
  if (substitutions && substitutions.length > 0) {
    return translation.replace(/\$(\d+)/g, (_, num) => {
      const index = parseInt(num, 10) - 1;
      return substitutions[index] || '';
    });
  }

  return translation;
});

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

// Mock global.platform
global.platform = {
  openTab: jest.fn(),
} as any;

describe('StackCard', () => {
  const mockSlide = {
    id: 'contentful-123',
    title: 'slideSmartAccountUpgradeTitle',
    description: 'slideSmartAccountUpgradeDescription',
    image: 'https://example.com/image.jpg',
    dismissed: false,
  };

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

  it('renders and translates Contentful i18n keys correctly', () => {
    render(<StackCard {...defaultProps} />);

    // Should translate the i18n keys from Contentful
    expect(screen.getByText('Switch to smart account')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Upgrade to a smart account for faster transactions, lower fees, and more flexibility in payments.',
      ),
    ).toBeInTheDocument();
  });

  it('uses original text when i18n key does not exist in Contentful content', () => {
    const slideWithMissingKey = {
      ...mockSlide,
      title: 'Already Localized Title',
      description: 'Already localized description from Contentful',
    };

    render(<StackCard {...defaultProps} slide={slideWithMissingKey} />);

    // Should use the original text when translation returns null
    expect(screen.getByText('Already Localized Title')).toBeInTheDocument();
    expect(
      screen.getByText('Already localized description from Contentful'),
    ).toBeInTheDocument();
  });

  it('always translates non-Contentful slides', () => {
    const nonContentfulSlide = {
      ...mockSlide,
      id: 'local-slide',
      title: 'slideSmartAccountUpgradeTitle',
      description: 'slideSmartAccountUpgradeDescription',
    };

    render(<StackCard {...defaultProps} slide={nonContentfulSlide} />);

    // Should translate for non-Contentful slides
    expect(screen.getByText('Switch to smart account')).toBeInTheDocument();
  });

  it('renders the close button with correct aria label', () => {
    render(<StackCard {...defaultProps} />);

    const closeButton = screen.getByTestId(
      `carousel-slide-${mockSlide.id}-close-button`,
    );
    expect(closeButton).toBeInTheDocument();

    // The aria label should use the translated title
    expect(closeButton).toHaveAttribute(
      'aria-label',
      'Close Switch to smart account',
    );
  });

  it('handles mixed content correctly - bridge slide', () => {
    const bridgeSlide = {
      ...mockSlide,
      id: 'contentful-456',
      title: 'slideBridgeTitle',
      description: 'slideBridgeDescription',
    };

    render(<StackCard {...defaultProps} slide={bridgeSlide} />);

    expect(screen.getByText('Bridge your assets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Move your assets between networks seamlessly and securely with MetaMask Bridge.',
      ),
    ).toBeInTheDocument();
  });
});
