import React from 'react';
import { render } from '@testing-library/react';
import { FullPageCard } from './full-page-card';

describe('FullPageCard', () => {
  it('renders children inside the card', () => {
    const { getByTestId, getByText } = render(
      <FullPageCard pageTestId="page" cardTestId="card">
        <p>Card content</p>
      </FullPageCard>,
    );

    const page = getByTestId('page');
    const card = getByTestId('card');

    expect(page).toContainElement(card);
    expect(card).toContainElement(getByText('Card content'));
  });
});
