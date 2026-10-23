/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { MarketingMomentTitle } from './marketing-moment-title';

const mockStore = configureMockStore();

const renderTitle = (ui: React.ReactElement, locale = 'en') => {
  const store = mockStore({
    localeMessages: { currentLocale: locale },
    metamask: { currentLocale: locale },
  });

  return render(<Provider store={store}>{ui}</Provider>);
};

describe('MarketingMomentTitle', () => {
  it('renders a Grotzec title for a supported language', () => {
    renderTitle(<MarketingMomentTitle>Perps are here</MarketingMomentTitle>);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Perps are here');
    expect(title).toHaveClass('font-hero');
    expect(title).toHaveClass('text-s-display-xl');
    expect(title).toHaveStyle({
      lineHeight: 0.8,
      letterSpacing: '-0.02em',
    });
  });

  it('switches to the default face at DisplayLg for an unsupported language', () => {
    renderTitle(
      <MarketingMomentTitle>パープスが登場</MarketingMomentTitle>,
      'ja',
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('font-default');
    expect(title).toHaveClass('text-s-display-lg');
    expect(title).not.toHaveClass('font-hero');
    expect(title).not.toHaveStyle({ letterSpacing: '-0.02em' });
  });

  it('reads a locale change from the store', () => {
    const { rerender } = renderTitle(
      <MarketingMomentTitle>Perps are here</MarketingMomentTitle>,
    );

    const koreanStore = mockStore({
      localeMessages: { currentLocale: 'ko' },
      metamask: { currentLocale: 'ko' },
    });
    rerender(
      <Provider store={koreanStore}>
        <MarketingMomentTitle>Perps are here</MarketingMomentTitle>
      </Provider>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveClass(
      'text-s-display-lg',
    );
  });

  it('keeps caller classes and style after the hero treatment', () => {
    renderTitle(
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
