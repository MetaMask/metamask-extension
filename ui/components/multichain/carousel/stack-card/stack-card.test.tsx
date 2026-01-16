import React from 'react';
import { render } from '@testing-library/react';
import { StackCard } from './stack-card';

// Mock the useI18nContext hook
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: unknown[]) => {
    // Simulate missing translation by returning null for non-existent keys
    if (key === 'missingTranslationKey') {
      return null;
    }
    // For closeSlide, return a template with substitution
    if (key === 'closeSlide') {
      return `Close ${substitutions?.[0] || ''}`;
    }
    // For other keys, just return the key
    return key;
  },
}));

describe('StackCard', () => {
  const mockSlide = {
    id: 'test-slide',
    title: 'testTitle',
    description: 'testDescription',
    image: 'test-image.png',
    href: 'https://example.com',
  };

  it('renders without crashing with valid translations', () => {
    const { container } = render(
      <StackCard
        slide={mockSlide}
        isCurrentCard={true}
        onTransitionToNextCard={jest.fn()}
      />,
    );
    expect(container).toBeDefined();
  });

  it('handles missing translation for slide title gracefully', () => {
    const slideWithMissingTranslation = {
      ...mockSlide,
      title: 'missingTranslationKey',
    };

    const { container } = render(
      <StackCard
        slide={slideWithMissingTranslation}
        isCurrentCard={true}
        onTransitionToNextCard={jest.fn()}
      />,
    );

    // Should fallback to the key itself
    expect(container.textContent).toContain('missingTranslationKey');
  });

  it('handles missing translation in closeSlide aria label gracefully', () => {
    const slideWithMissingTranslation = {
      ...mockSlide,
      title: 'missingTranslationKey',
    };

    const { getByTestId } = render(
      <StackCard
        slide={slideWithMissingTranslation}
        isCurrentCard={true}
        onTransitionToNextCard={jest.fn()}
      />,
    );

    const closeButton = getByTestId(
      `carousel-slide-${slideWithMissingTranslation.id}-close-button`,
    );

    // Should use the fallback key for substitution instead of null
    expect(closeButton.getAttribute('aria-label')).toBe(
      'Close missingTranslationKey',
    );
  });

  it('handles contentful content correctly', () => {
    const contentfulSlide = {
      id: 'contentful-test',
      title: 'Contentful Title',
      description: 'Contentful Description',
      image: 'contentful-image.png',
    };

    const { container } = render(
      <StackCard
        slide={contentfulSlide}
        isCurrentCard={true}
        onTransitionToNextCard={jest.fn()}
      />,
    );

    // Should use raw title/description, not translate
    expect(container.textContent).toContain('Contentful Title');
    expect(container.textContent).toContain('Contentful Description');
  });
});
