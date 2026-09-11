import React from 'react';
import { render, screen } from '@testing-library/react';
import { MoneyActivitySettlingSkeletons } from './money-activity-settling-skeletons';

describe('MoneyActivitySettlingSkeletons', () => {
  it('renders the settling placeholder', () => {
    render(
      <MoneyActivitySettlingSkeletons>
        <div data-testid="child" />
      </MoneyActivitySettlingSkeletons>,
    );

    expect(screen.getByTestId('money-activity-settling')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
