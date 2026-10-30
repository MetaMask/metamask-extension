/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextVariant } from '@metamask/design-system-react';
import { MarketingMomentTitle } from './marketing-moment-title';

describe('MarketingMomentTitle', () => {
  it('renders the title text', () => {
    render(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent('Perps are here');
    expect(title).toHaveClass('[font-size-adjust:from-font]');
  });

  it('uses a caller variant and class name', () => {
    render(
      <MarketingMomentTitle
        variant={TextVariant.DisplayMd}
        className="text-accent04-light"
      >
        Spend and earn
      </MarketingMomentTitle>,
    );

    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent('Spend and earn');
    expect(title).toHaveClass('text-accent04-light');
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
