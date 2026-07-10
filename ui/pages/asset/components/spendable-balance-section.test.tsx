import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { SpendableBalanceSection } from './spendable-balance-section';

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

describe('SpendableBalanceSection', () => {
  it('renders total, spendable, and reserved balances', () => {
    renderWithProviders(
      <SpendableBalanceSection
        totalBalance="250"
        symbol="XLM"
        baseReserve="2.5"
        fiatValue={105}
      />,
    );

    expect(screen.getByTestId('spendable-balance-section')).toBeInTheDocument();
    expect(screen.getByText(messages.balance.message)).toBeInTheDocument();
    expect(
      screen.getByTestId('spendable-balance-total-balance'),
    ).toHaveTextContent('250 XLM');
    expect(
      screen.getByTestId('spendable-balance-spendable-balance'),
    ).toHaveTextContent('247.5 XLM');
    expect(
      screen.getByTestId('spendable-balance-base-reserved'),
    ).toHaveTextContent('2.5 XLM');
    expect(
      screen.getByTestId('spendable-balance-fiat-value'),
    ).toHaveTextContent('$105.00');
  });

  it('clamps spendable balance at zero when reserve exceeds total', () => {
    renderWithProviders(
      <SpendableBalanceSection
        totalBalance="1"
        symbol="XLM"
        baseReserve="2.5"
        fiatValue={null}
      />,
    );

    expect(
      screen.getByTestId('spendable-balance-spendable-balance'),
    ).toHaveTextContent('0 XLM');
  });
});
