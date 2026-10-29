import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { MusdPositionSection } from './musd-position-section';

jest.mock('../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (n: number) => `$${n.toFixed(2)}`,
}));

const store = configureMockStore()({
  metamask: { currentCurrency: 'usd' },
  locale: { currentLocale: 'en' },
});

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <I18nContext.Provider value={tEn as any}>
        {component}
      </I18nContext.Provider>
    </Provider>,
  );

describe('MusdPositionSection', () => {
  it('renders heading and balance/value rows', () => {
    renderWithProviders(
      <MusdPositionSection
        balanceDisplay={`1,000.5 ${messages.musdSymbol.message}`}
        fiatValue={1000.5}
        showFiat
      />,
    );

    expect(screen.getByTestId('musd-position-section')).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetPositionTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetPositionBalance.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`1,000.5 ${messages.musdSymbol.message}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetPositionValue.message),
    ).toBeInTheDocument();
  });

  it('hides value row when showFiat is false', () => {
    renderWithProviders(
      <MusdPositionSection
        balanceDisplay={`100 ${messages.musdSymbol.message}`}
        fiatValue={null}
        showFiat={false}
      />,
    );

    expect(
      screen.queryByText(messages.musdAssetPositionValue.message),
    ).not.toBeInTheDocument();
  });
});
