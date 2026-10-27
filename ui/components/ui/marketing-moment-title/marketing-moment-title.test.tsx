/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { MarketingMomentTitle } from './marketing-moment-title';

const renderTitle = (ui: React.ReactElement, locale = 'en') => {
  const store = configureMockStore()({
    localeMessages: { currentLocale: locale },
    metamask: { currentLocale: locale },
  });

  return render(<Provider store={store}>{ui}</Provider>);
};

describe('MarketingMomentTitle', () => {
  it('renders the title text', () => {
    renderTitle(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Perps are here');
    expect(title).toHaveStyle({
      fontSize: 'clamp(1.75rem, 9.5cqw, 3.75rem)',
    });
  });

  it('keeps a caller style', () => {
    renderTitle(
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

  it('uses the hero face for a supported language', () => {
    renderTitle(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-hero');
  });

  it('uses the default face for an unsupported language', () => {
    renderTitle(
      <MarketingMomentTitle>パープスが登場</MarketingMomentTitle>,
      'ja',
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('font-default');
    expect(title).toHaveClass('text-s-display-md');
    expect(title).not.toHaveClass('font-hero');
  });
});
