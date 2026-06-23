import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import { StellarNativeBalanceSection } from './stellar-native-balance-section';

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

describe('StellarNativeBalanceSection', () => {
  it('renders total, spendable, and reserved balances', () => {
    renderWithProviders(
      <StellarNativeBalanceSection
        totalBalance="250"
        symbol="XLM"
        baseReserve="2.5"
        fiatValue={105}
        showFiat
      />,
    );

    expect(
      screen.getByTestId('stellar-native-balance-section'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.stellarNativeBalanceTitle.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('stellar-native-total-balance')).toHaveTextContent(
      '250.00 XLM',
    );
    expect(
      screen.getByTestId('stellar-native-spendable-balance'),
    ).toHaveTextContent('247.50 XLM');
    expect(
      screen.getByTestId('stellar-native-reserved-balance'),
    ).toHaveTextContent('2.50 XLM');
    expect(screen.getByTestId('stellar-native-fiat-value')).toHaveTextContent(
      '$105.00',
    );
  });

  it('hides fiat value row when showFiat is false', () => {
    renderWithProviders(
      <StellarNativeBalanceSection
        totalBalance="250"
        symbol="XLM"
        baseReserve="2.5"
        fiatValue={105}
        showFiat={false}
      />,
    );

    expect(
      screen.queryByText(messages.stellarNativeValue.message),
    ).not.toBeInTheDocument();
  });

  it('clamps spendable balance at zero when reserve exceeds total', () => {
    renderWithProviders(
      <StellarNativeBalanceSection
        totalBalance="1"
        symbol="XLM"
        baseReserve="2.5"
        fiatValue={null}
        showFiat={false}
      />,
    );

    expect(
      screen.getByTestId('stellar-native-spendable-balance'),
    ).toHaveTextContent('0.00 XLM');
  });
});
