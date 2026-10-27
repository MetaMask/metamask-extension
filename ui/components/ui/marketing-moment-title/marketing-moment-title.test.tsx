/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarketingMomentTitle } from './marketing-moment-title';

describe('MarketingMomentTitle', () => {
  it('renders the title text', () => {
    render(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent('Perps are here');
    expect(title).toHaveClass('[font-size-adjust:from-font]');
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
