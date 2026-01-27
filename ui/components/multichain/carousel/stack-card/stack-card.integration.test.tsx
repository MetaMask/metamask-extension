/**
 * Integration test to verify the fix for METAMASK-XSYQ
 * Error: Unable to find value of key "slideSmartAccountUpgradeDescription" for locale "en"
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { CarouselSlide } from '../../../../../shared/constants/app-state';
import { StackCard } from './stack-card';

// Mock the i18n hook to simulate the exact error scenario
const mockT = jest.fn((key: string, substitutions?: string[]) => {
  const translations: Record<string, string> = {
    closeSlide: substitutions ? `Close ${substitutions[0]}` : 'Close',
  };

  // Simulate the behavior where missing keys return null
  // These keys don't exist in messages.json
  if (
    key === 'slideSmartAccountUpgradeTitle' ||
    key === 'slideSmartAccountUpgradeDescription' ||
    key === 'slideFundWalletTitle' ||
    key === 'slideFundWalletDescription'
  ) {
    return null;
  }

  return translations[key] || null;
});

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

// Mock the platform API
global.platform = {
  openTab: jest.fn(),
} as unknown as typeof global.platform;

describe('StackCard - METAMASK-XSYQ Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles slide with non-existent i18n keys without throwing errors', () => {
    // This simulates the exact scenario from the error report
    const problemSlide: CarouselSlide = {
      id: 'smart-account-upgrade', // ID doesn't start with 'contentful-'
      title: 'slideSmartAccountUpgradeTitle', // This key doesn't exist
      description: 'slideSmartAccountUpgradeDescription', // This key doesn't exist
      image: 'https://example.com/smart-account.jpg',
    };

    // This should not throw any errors
    expect(() => {
      render(
        <StackCard
          slide={problemSlide}
          isCurrentCard={true}
          onTransitionToNextCard={jest.fn()}
        />,
      );
    }).not.toThrow();

    // Verify the component attempts to translate
    expect(mockT).toHaveBeenCalledWith('slideSmartAccountUpgradeTitle');
    expect(mockT).toHaveBeenCalledWith('slideSmartAccountUpgradeDescription');

    // Verify fallback: original text is displayed when translation returns null
    expect(
      screen.getByText('slideSmartAccountUpgradeTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('slideSmartAccountUpgradeDescription'),
    ).toBeInTheDocument();

    // Verify the close button aria-label works with the fallback text
    const closeButton = screen.getByTestId(
      'carousel-slide-smart-account-upgrade-close-button',
    );
    expect(closeButton).toBeInTheDocument();

    // Verify closeSlide was called with the fallback title (not null)
    expect(mockT).toHaveBeenCalledWith('closeSlide', [
      'slideSmartAccountUpgradeTitle',
    ]);
  });

  it('handles multiple problematic slides without errors', () => {
    const slides: CarouselSlide[] = [
      {
        id: 'smart-account-upgrade',
        title: 'slideSmartAccountUpgradeTitle',
        description: 'slideSmartAccountUpgradeDescription',
        image: 'https://example.com/smart-account.jpg',
      },
      {
        id: 'fund-wallet',
        title: 'slideFundWalletTitle',
        description: 'slideFundWalletDescription',
        image: 'https://example.com/fund-wallet.jpg',
      },
    ];

    // Should render all slides without errors
    slides.forEach((slide) => {
      expect(() => {
        const { unmount } = render(
          <StackCard
            slide={slide}
            isCurrentCard={true}
            onTransitionToNextCard={jest.fn()}
          />,
        );
        unmount();
      }).not.toThrow();
    });
  });

  it('prevents "Insufficient number of substitutions" error for closeSlide', () => {
    const problemSlide: CarouselSlide = {
      id: 'test-slide',
      title: 'slideSmartAccountUpgradeTitle', // Returns null on translation
      description: 'slideSmartAccountUpgradeDescription',
      image: 'https://example.com/image.jpg',
    };

    render(
      <StackCard
        slide={problemSlide}
        isCurrentCard={true}
        onTransitionToNextCard={jest.fn()}
      />,
    );

    // The critical fix: closeSlide should receive a valid string, not null
    // Before the fix, t(slide.title) returned null, causing the error
    // After the fix, getDisplayText returns the original text as fallback
    const closeSlideCall = mockT.mock.calls.find(
      (call) => call[0] === 'closeSlide',
    );

    expect(closeSlideCall).toBeDefined();
    expect(closeSlideCall?.[1]).toBeDefined();
    expect(closeSlideCall?.[1]?.[0]).toBe('slideSmartAccountUpgradeTitle');
    expect(closeSlideCall?.[1]?.[0]).not.toBeNull();
    expect(closeSlideCall?.[1]?.[0]).not.toBeUndefined();
  });

  it('properly handles Contentful slides (control test)', () => {
    const contentfulSlide: CarouselSlide = {
      id: 'contentful-123',
      title: 'Smart Account Upgrade',
      description: 'Upgrade your account to a smart account',
      image: 'https://example.com/smart-account.jpg',
    };

    render(
      <StackCard
        slide={contentfulSlide}
        isCurrentCard={true}
        onTransitionToNextCard={jest.fn()}
      />,
    );

    // Contentful slides should not attempt translation
    expect(mockT).not.toHaveBeenCalledWith('Smart Account Upgrade');
    expect(mockT).not.toHaveBeenCalledWith(
      'Upgrade your account to a smart account',
    );

    // Should display the literal text
    expect(screen.getByText('Smart Account Upgrade')).toBeInTheDocument();
    expect(
      screen.getByText('Upgrade your account to a smart account'),
    ).toBeInTheDocument();

    // closeSlide should still work with literal title
    expect(mockT).toHaveBeenCalledWith('closeSlide', ['Smart Account Upgrade']);
  });
});
