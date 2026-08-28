import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import type { MoneyDepositToken } from '../../../hooks/money/money-deposit-token-utils';
import { MoneyPotentialEarnings } from './money-potential-earnings';

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value),
  }),
}));

const createToken = (
  index: number,
  overrides: Partial<MoneyDepositToken> = {},
): MoneyDepositToken => ({
  address: `0x${index.toString().padStart(40, '0')}`,
  chainId: '0x1',
  decimals: 18,
  image: 'token.png',
  symbol: `TOK${index}`,
  title: `Token ${index}`,
  moneyFiatAmountUsd: index * 100,
  ...overrides,
});

describe('MoneyPotentialEarnings', () => {
  it('renders the section without token rows when there are no eligible tokens', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[]}
        apyDecimal={0.04}
        isNoFeeToken={() => false}
        privacyMode={false}
      />,
    );

    expect(screen.getByTestId('money-potential-earnings')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnOnCrypto.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnOnCryptoDescription.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-potential-earnings-token-row'),
    ).not.toBeInTheDocument();
  });

  it('renders aggregate and per-token projected earnings', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[createToken(50)]}
        apyDecimal={0.04}
        isNoFeeToken={() => false}
        privacyMode={false}
      />,
    );

    expect(
      screen.getByText(messages.moneyEarnOnCrypto.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-potential-earnings-total'),
    ).toHaveTextContent('$5,000.00');
    expect(
      screen.getByTestId('money-potential-earnings-projection'),
    ).toHaveTextContent('+$200.00');
    expect(
      screen.getByTestId('money-potential-earnings-token-projection'),
    ).toHaveTextContent('+$200.00');
  });

  it('renders the generic description when APY is unavailable', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[createToken(1)]}
        apyDecimal={undefined}
        isNoFeeToken={() => false}
        privacyMode={false}
      />,
    );

    expect(
      screen.getByText(messages.moneyEarnOnCryptoDescription.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-potential-earnings-projection'),
    ).not.toBeInTheDocument();
  });

  it('renders at most five token rows and View all for additional tokens', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={Array.from({ length: 6 }, (_, index) => createToken(index + 1))}
        apyDecimal={0.04}
        isNoFeeToken={() => false}
        privacyMode={false}
      />,
    );

    expect(
      screen.getAllByTestId('money-potential-earnings-token-row'),
    ).toHaveLength(5);
    expect(screen.queryByText('Token 6')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.viewAll.message }),
    ).toBeDisabled();
  });

  it('hides View all when all tokens are visible', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[createToken(1)]}
        apyDecimal={0.04}
        isNoFeeToken={() => false}
        privacyMode={false}
      />,
    );

    expect(
      screen.queryByRole('button', { name: messages.viewAll.message }),
    ).not.toBeInTheDocument();
  });

  it('renders No fee only for subsidized tokens', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[createToken(1), createToken(2)]}
        apyDecimal={0.04}
        isNoFeeToken={({ symbol }) => symbol === 'TOK1'}
        privacyMode={false}
      />,
    );

    expect(
      screen.getAllByText(messages.moneyEarnOnCryptoNoFee.message),
    ).toHaveLength(1);
  });

  it('masks balances and projections in privacy mode', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[createToken(50)]}
        apyDecimal={0.04}
        isNoFeeToken={() => false}
        privacyMode
      />,
    );

    expect(
      screen.getByTestId('money-potential-earnings-total'),
    ).toHaveTextContent('•'.repeat(9));
    expect(
      screen.getByTestId('money-potential-earnings-token-projection'),
    ).toHaveTextContent('•'.repeat(6));
  });

  it('keeps Add controls inert', () => {
    renderWithLocalization(
      <MoneyPotentialEarnings
        tokens={[createToken(1)]}
        apyDecimal={0.04}
        isNoFeeToken={() => false}
        privacyMode={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: messages.moneyAdd.message }),
    ).toBeDisabled();
  });
});
