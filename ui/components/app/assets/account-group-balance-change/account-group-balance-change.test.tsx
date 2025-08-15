import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Store } from 'redux';
import { AccountGroupBalanceChange } from './account-group-balance-change';

// Mutable mocks to control selector outputs per test
let mockFeatureFlagEnabled = true;
const mockPercentByPeriod: Record<string, number> = {};
const mockChangeByPeriod: Record<
  string,
  { amountChangeInUserCurrency: number }
> = {};

jest.mock('../../../../selectors', () => ({
  getIsMultichainAccountsState2Enabled: () => mockFeatureFlagEnabled,
  getCurrentCurrency: () => 'USD',
  getIntlLocale: () => 'en',
}));

jest.mock('../../../../selectors/assets', () => ({
  // Return selector factories that themselves return constant selectors
  selectSelectedGroupPortfolioPercentChange: (period: string) => () =>
    mockPercentByPeriod[period] ?? 0,
  selectSelectedGroupPortfolioChange: (period: string) => () => ({
    period,
    currentTotalInUserCurrency: 0,
    previousTotalInUserCurrency: 0,
    amountChangeInUserCurrency:
      mockChangeByPeriod[period]?.amountChangeInUserCurrency ?? 0,
    percentChange: mockPercentByPeriod[period] ?? 0,
    userCurrency: 'USD',
  }),
}));

// Minimal Redux store stub compatible with Provider
type MinimalStore = {
  getState: () => unknown;
  dispatch: (action: unknown) => unknown;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (next: unknown) => void;
  [Symbol.observable]?: () => unknown;
};

const buildStore = () =>
  ({
    getState: () => ({
      metamask: {
        currentCurrency: 'USD',
      },
      localeMessages: {
        currentLocale: 'en',
        current: {},
      },
    }),
    dispatch: () => undefined,
    subscribe: () => () => undefined,
    replaceReducer: () => undefined,
    [Symbol.observable]: () => ({
      subscribe: () => ({ unsubscribe: () => undefined }),
    }),
  }) as MinimalStore;

const renderWithMinimalProvider = (ui: React.ReactElement) => {
  const store = buildStore();
  const typedStore = store as unknown as Store;
  return render(
    <Provider store={typedStore}>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
    </Provider>,
  );
};

describe('AccountGroupBalanceChange', () => {
  beforeEach(() => {
    mockFeatureFlagEnabled = true;
    for (const key of Object.keys(mockPercentByPeriod)) {
      delete mockPercentByPeriod[key];
    }
    for (const key of Object.keys(mockChangeByPeriod)) {
      delete mockChangeByPeriod[key];
    }
  });

  it('returns null when feature flag is disabled', () => {
    mockFeatureFlagEnabled = false;
    const { container } = renderWithMinimalProvider(
      <AccountGroupBalanceChange period="1d" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders positive percent and amount for 1d', () => {
    mockPercentByPeriod['1d'] = 1.23;
    mockChangeByPeriod['1d'] = { amountChangeInUserCurrency: 100 };
    renderWithMinimalProvider(<AccountGroupBalanceChange period="1d" />);

    expect(screen.getByText(/\+1\.23%/u)).toBeInTheDocument();
    // Accept various currency formatting (e.g., "$100", "$100.00") and optional space suffix
    expect(
      screen.getByText(/\+\$?100(\.00)?\s?/u, { exact: false }),
    ).toBeInTheDocument();
  });

  it('renders negative percent and amount for 7d', () => {
    mockPercentByPeriod['7d'] = -2.34;
    mockChangeByPeriod['7d'] = { amountChangeInUserCurrency: -50 };
    renderWithMinimalProvider(<AccountGroupBalanceChange period="7d" />);

    expect(screen.getByText(/-2\.34%/u)).toBeInTheDocument();
    expect(
      screen.getByText(/-\$?50(\.00)?\s?/u, { exact: false }),
    ).toBeInTheDocument();
  });
});
