/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarketingMomentTitle } from './marketing-moment-title';

describe('MarketingMomentTitle', () => {
  it('renders the title text with the hero metrics', () => {
    render(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Perps are here');
    expect(title).toHaveStyle({
      lineHeight: 0.8,
      letterSpacing: '-0.02em',
    });
  });

  it('keeps a caller style after the hero treatment', () => {
    render(
      <MarketingMomentTitle
        data-testid="marketing-title"
        style={{ opacity: 0.5 }}
      >
        Spend and earn
      </MarketingMomentTitle>,
    );

    expect(screen.getByTestId('marketing-title')).toHaveStyle({
      lineHeight: 0.8,
      letterSpacing: '-0.02em',
      opacity: 0.5,
    });
  });
});
