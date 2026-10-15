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

const createStore = (privacyMode = false) =>
  configureMockStore()({
    metamask: {
      currentCurrency: 'usd',
      preferences: { privacyMode },
    },
    locale: { currentLocale: 'en' },
  });

const renderWithProviders = (
  component: React.ReactElement,
  { privacyMode = false }: { privacyMode?: boolean } = {},
) =>
  render(
    <Provider store={createStore(privacyMode)}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <I18nContext.Provider value={tEn as any}>
        {component}
      </I18nContext.Provider>
    </Provider>,
  );

describe('SpendableBalanceSection', () => {
  const defaultProps = {
    minimumReserveBalance: '2.5',
    spendableBalance: '247.5',
    totalBalance: '250',
    symbol: 'XLM',
    fiatValue: 105,
  };

  it('renders total, spendable, reserved, and fiat balances', () => {
    renderWithProviders(<SpendableBalanceSection {...defaultProps} />);

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

  it('renders em dash when fiat value is null', () => {
    renderWithProviders(
      <SpendableBalanceSection {...defaultProps} fiatValue={null} />,
    );

    expect(
      screen.getByTestId('spendable-balance-fiat-value'),
    ).toHaveTextContent('—');
  });

  it('renders labels for total, fiat, spendable, and reserved rows', () => {
    renderWithProviders(<SpendableBalanceSection {...defaultProps} />);

    expect(
      screen.getByText(messages.spendableBalanceTotalBalance.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.spendableBalanceFiatValue.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.spendableBalance.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.spendableBalanceBaseReserved.message),
    ).toBeInTheDocument();
  });

  it('masks balances when privacy mode is enabled', () => {
    renderWithProviders(<SpendableBalanceSection {...defaultProps} />, {
      privacyMode: true,
    });

    const maskedBalance = '•••••••••';
    expect(
      screen.getByTestId('spendable-balance-total-balance'),
    ).toHaveTextContent(maskedBalance);
    expect(
      screen.getByTestId('spendable-balance-spendable-balance'),
    ).toHaveTextContent(maskedBalance);
    expect(
      screen.getByTestId('spendable-balance-base-reserved'),
    ).toHaveTextContent(maskedBalance);
    expect(
      screen.getByTestId('spendable-balance-fiat-value'),
    ).toHaveTextContent(maskedBalance);
    expect(screen.queryByText('250 XLM')).not.toBeInTheDocument();
    expect(screen.queryByText('247.5 XLM')).not.toBeInTheDocument();
    expect(screen.queryByText('2.5 XLM')).not.toBeInTheDocument();
    expect(screen.queryByText('$105.00')).not.toBeInTheDocument();
  });
});
