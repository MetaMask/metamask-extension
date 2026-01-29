import React from 'react';
import { render, screen } from '@testing-library/react';
import { StackCard } from '../stack-card/stack-card';
import { useI18nContext } from '../../../../hooks/useI18nContext';

jest.mock('../../../../hooks/useI18nContext');

describe('StackCard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('falls back to raw slide values when translations are missing', () => {
    const translateMock = jest
      .fn()
      .mockImplementation(
        (key: string, substitutions?: (string | undefined)[]) => {
          if (key === 'closeSlide') {
            const substitution = substitutions?.[0] ?? '';
            return `Close ${substitution}`;
          }

          return null;
        },
      );

    (useI18nContext as jest.Mock).mockReturnValue(translateMock);

    render(
      <StackCard
        slide={{
          id: 'test-slide',
          title: 'slideDebitCardTitle',
          description: 'slideDebitCardDescription',
          image: 'https://example.com/image.jpg',
        }}
        isCurrentCard
        onTransitionToNextCard={jest.fn()}
      />,
    );

    expect(screen.getByText('slideDebitCardTitle')).toBeInTheDocument();
    expect(
      screen.getByText('slideDebitCardDescription'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Close slideDebitCardTitle'),
    ).toBeInTheDocument();
  });
});
