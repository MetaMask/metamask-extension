import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { BalanceOverview } from '.';

const render = (useNativeCurrencyAsPrimaryCurrency = true) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currencyRates: {
        ETH: {
          conversionRate: 1618,
        },
      },
      preferences: {
        ...mockState.metamask.preferences,
        showFiatInTestnets: true,
        useNativeCurrencyAsPrimaryCurrency,
      },
    },
  });
  return renderWithProvider(
    <BalanceOverview balance="47f943fc469e0" loading={false} />,
    store,
  );
};

describe('Balance Overview and Portfolio for Tokens', () => {
  it('should output correct ETH total value', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
    expect(screen.getByText('0.0013')).toBeInTheDocument();
  });

  it('should output correct USD total value', () => {
    const { container } = render(false);
    expect(container).toMatchSnapshot();
    expect(screen.getByText('$2.05')).toBeInTheDocument();
  });
});
