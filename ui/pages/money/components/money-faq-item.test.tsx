import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { MoneyFaqItem } from './money-faq-item';

describe('MoneyFaqItem', () => {
  it('is collapsed by default', () => {
    renderWithLocalization(
      <MoneyFaqItem question="Question" answer="Answer" testId="faq-item" />,
    );

    expect(screen.getByTestId('faq-item')).not.toHaveAttribute('open');
    expect(screen.getByText('Question')).toBeInTheDocument();
  });

  it('expands to reveal the answer', () => {
    renderWithLocalization(
      <MoneyFaqItem question="Question" answer="Answer" testId="faq-item" />,
    );

    fireEvent.click(screen.getByText('Question'));

    expect(screen.getByTestId('faq-item')).toHaveAttribute('open');
    expect(screen.getByText('Answer')).toBeInTheDocument();
  });
});
