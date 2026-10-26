/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextVariant } from '@metamask/design-system-react';
import { MarketingMomentTitle } from './marketing-moment-title';

describe('MarketingMomentTitle', () => {
  it('renders a Grotzec DisplayXl title', () => {
    render(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Perps are here');
    expect(title).toHaveClass('font-hero');
    expect(title).toHaveClass('text-s-display-xl');
    expect(title).toHaveStyle({
      lineHeight: 0.8,
      letterSpacing: '-0.02em',
    });
  });

  it('keeps a requested size', () => {
    render(
      <MarketingMomentTitle variant={TextVariant.DisplayMd}>
        Perps are here
      </MarketingMomentTitle>,
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('text-s-display-md');
    expect(title).toHaveClass('font-hero');
  });

  it('keeps caller classes and style after the hero treatment', () => {
    render(
      <MarketingMomentTitle
        data-testid="marketing-title"
        className="text-accent04-light"
        style={{ opacity: 0.5 }}
      >
        Spend and earn
      </MarketingMomentTitle>,
    );

    const title = screen.getByTestId('marketing-title');
    expect(title).toHaveClass('text-accent04-light');
    expect(title).toHaveClass('font-hero');
    expect(title).toHaveStyle({
      lineHeight: 0.8,
      letterSpacing: '-0.02em',
      opacity: 0.5,
    });
  });
});
