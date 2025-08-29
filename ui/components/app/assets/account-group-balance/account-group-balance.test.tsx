import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { Store } from 'redux';
import { AccountGroupBalance as AccountGroupBalanceType } from '@metamask/assets-controllers';
import { AccountGroupBalance } from './account-group-balance';

let mockSelectedGroupBalance: AccountGroupBalanceType | null = null;

jest.mock('../../../../selectors/assets', () => ({
  selectBalanceBySelectedAccountGroup: () => mockSelectedGroupBalance,
}));

jest.mock('../../../../selectors', () => ({
  getPreferences: () => ({ privacyMode: false }),
}));

jest.mock('../../../../ducks/locale/locale', () => ({
  getIntlLocale: () => 'en',
}));

jest.mock('../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: () => 'usd',
}));

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
      metamask: {},
      localeMessages: { currentLocale: 'en', current: {} },
    }),
    dispatch: () => undefined,
    subscribe: () => () => undefined,
    replaceReducer: () => undefined,
    [Symbol.observable]: () => ({
      subscribe: () => ({ unsubscribe: () => undefined }),
    }),
  }) as MinimalStore;

const renderWithProvider = (ui: React.ReactElement) => {
  const store = buildStore();
  const typedStore = store as unknown as Store;
  return render(
    <Provider store={typedStore}>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
    </Provider>,
  );
};

describe('AccountGroupBalance', () => {
  beforeEach(() => {
    mockSelectedGroupBalance = null;
  });

  it('renders spinner when no selected group balance', () => {
    const { container } = renderWithProvider(
      <AccountGroupBalance
        classPrefix="coin"
        balanceIsCached={false}
        handleSensitiveToggle={() => undefined}
      />,
    );
    expect(container.querySelector('.loading-overlay__spinner')).toBeTruthy();
  });

  it('renders formatted balance and currency when data available', () => {
    mockSelectedGroupBalance = {
      walletId: 'w1',
      groupId: 'w1/g1',
      totalBalanceInUserCurrency: 123.45,
      userCurrency: 'usd',
    };
    renderWithProvider(
      <AccountGroupBalance
        classPrefix="coin"
        balanceIsCached={false}
        handleSensitiveToggle={() => undefined}
      />,
    );

    // Expect currency label
    expect(screen.getByText('USD')).toBeInTheDocument();
    // Expect a currency-formatted value (allow $ prefix and decimals)
    expect(screen.getByText(/\$?123(\.45)?/u)).toBeInTheDocument();
  });
});
