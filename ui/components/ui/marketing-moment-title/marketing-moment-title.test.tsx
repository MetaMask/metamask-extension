/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarketingMomentTitle } from './marketing-moment-title';

describe('MarketingMomentTitle', () => {
  it('renders the title text', () => {
    render(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Perps are here',
    );
  });

  it('keeps a caller style', () => {
    render(
      <MarketingMomentTitle
        data-testid="marketing-title"
        style={{ opacity: 0.5 }}
      >
        Spend and earn
      </MarketingMomentTitle>,
    );

    expect(screen.getByTestId('marketing-title')).toHaveStyle({
      opacity: 0.5,
    });
  });
});
